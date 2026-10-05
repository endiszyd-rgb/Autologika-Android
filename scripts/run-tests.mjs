import {readdir} from 'node:fs/promises'

// Syntax detection supports the application's ES modules on Node 22 and 24.
// Run in one process so the report contains individual tests on either version.
const directory=new URL('../tests/',import.meta.url)
for(const file of (await readdir(directory)).filter(name=>name.endsWith('.test.mjs')).sort()){
 await import(new URL(file,directory))
}
