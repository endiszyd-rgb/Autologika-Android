package pl.autologika.mobile

import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File

class DeliveryOcrModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "DeliveryOcr"

  @ReactMethod
  fun recognize(uriString: String, promise: Promise) {
    try {
      val uri = when {
        uriString.startsWith("content://") || uriString.startsWith("file://") -> Uri.parse(uriString)
        else -> Uri.fromFile(File(uriString))
      }
      val image = InputImage.fromFilePath(context, uri)
      val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
      recognizer.process(image)
        .addOnSuccessListener { result ->
          val elements = Arguments.createArray()
          result.textBlocks.forEachIndexed { blockIndex, block ->
            block.lines.forEachIndexed { lineIndex, line ->
              line.elements.forEach { element ->
                val box = element.boundingBox ?: return@forEach
                val entry = Arguments.createMap()
                entry.putString("text", element.text)
                entry.putInt("left", box.left)
                entry.putInt("top", box.top)
                entry.putInt("right", box.right)
                entry.putInt("bottom", box.bottom)
                entry.putInt("block", blockIndex)
                entry.putInt("line", lineIndex)
                elements.pushMap(entry)
              }
            }
          }
          val response = Arguments.createMap()
          response.putString("text", result.text)
          response.putInt("width", image.width)
          response.putInt("height", image.height)
          response.putArray("elements", elements)
          recognizer.close()
          promise.resolve(response)
        }
        .addOnFailureListener { error ->
          recognizer.close()
          promise.reject("DELIVERY_OCR_FAILED", "Nie udało się rozpoznać dokumentu.", error)
        }
    } catch (error: Exception) {
      promise.reject("DELIVERY_OCR_INPUT", error.message ?: "Nie można otworzyć zdjęcia dokumentu.", error)
    }
  }
}

class DeliveryOcrPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(DeliveryOcrModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
