package pl.autologika.mobile

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File

class DeliveryOcrModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  companion object {
    private const val DOCUMENT_SCAN_REQUEST = 7614
  }

  private var pendingScan: Promise? = null
  private val activityListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != DOCUMENT_SCAN_REQUEST) return
      val promise = pendingScan ?: return
      pendingScan = null

      if (resultCode != Activity.RESULT_OK) {
        val response = Arguments.createMap()
        response.putBoolean("cancelled", true)
        promise.resolve(response)
        return
      }

      try {
        val result = GmsDocumentScanningResult.fromActivityResultIntent(data)
        val page = result?.pages?.firstOrNull()
        if (page == null) {
          promise.reject("DELIVERY_SCAN_EMPTY", "Skaner nie zwrócił obrazu dokumentu.")
          return
        }
        val response = Arguments.createMap()
        response.putBoolean("cancelled", false)
        response.putString("uri", page.imageUri.toString())
        response.putString("mimeType", "image/jpeg")
        response.putString("fileName", "skan-dokumentu.jpg")
        promise.resolve(response)
      } catch (error: Exception) {
        promise.reject("DELIVERY_SCAN_RESULT", "Nie udało się otworzyć poprawionego skanu dokumentu.", error)
      }
    }
  }

  init {
    context.addActivityEventListener(activityListener)
  }

  override fun getName() = "DeliveryOcr"

  override fun invalidate() {
    context.removeActivityEventListener(activityListener)
    pendingScan?.reject("DELIVERY_SCAN_CLOSED", "Skanowanie dokumentu zostało przerwane.")
    pendingScan = null
    super.invalidate()
  }

  @ReactMethod
  fun scanDocument(promise: Promise) {
    val activity = context.currentActivity
    if (activity == null) {
      promise.reject("DELIVERY_SCAN_ACTIVITY", "Nie można otworzyć skanera bez aktywnego okna aplikacji.")
      return
    }
    if (pendingScan != null) {
      promise.reject("DELIVERY_SCAN_BUSY", "Skaner dokumentu jest już otwarty.")
      return
    }

    val options = GmsDocumentScannerOptions.Builder()
      .setGalleryImportAllowed(true)
      .setPageLimit(1)
      .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
      .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
      .build()

    pendingScan = promise
    GmsDocumentScanning.getClient(options).getStartScanIntent(activity)
      .addOnSuccessListener { sender ->
        try {
          activity.startIntentSenderForResult(sender, DOCUMENT_SCAN_REQUEST, null, 0, 0, 0)
        } catch (error: Exception) {
          pendingScan = null
          promise.reject("DELIVERY_SCAN_START", "Nie udało się uruchomić skanera dokumentu.", error)
        }
      }
      .addOnFailureListener { error ->
        pendingScan = null
        promise.reject("DELIVERY_SCAN_UNAVAILABLE", "Skaner dokumentu Google nie jest dostępny na tym urządzeniu.", error)
      }
  }

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
