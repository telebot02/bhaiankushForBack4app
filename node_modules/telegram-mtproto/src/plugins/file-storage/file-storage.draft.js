
import Promise from 'bluebird'
import toPairs from 'ramda/src/toPairs'
import fromPairs from 'ramda/src/fromPairs'

// import type { AsyncStorage } from '../index.h'

const { watchFile } = require('fs')

import { readData, writeData } from './fixtures'

export class FileSystemDriver {
  filepath: string
  syncTime: number
  constructor(filepath: string) {
    this.filepath = filepath
    this.updateTime()
    watchFile(filepath, { interval: 500 }, this.watcher)
  }
  get syncTimeString(): string {
    const date = new Date(this.syncTime)
    const str = date.toTimeString()
    return str
  }
  updateTime(syncTime?: number) {
    return this.syncTime = syncTime
      ? syncTime
      : Date.now()
  }
  async mergeUpdate(update: string, syncTime: number) {
    if (syncTime >= this.syncTime) {
      this.updateTime(syncTime)
      await writeData(this.filepath, update)
    }
  }
  async write(obj: any) {
    const time = this.updateTime()
    const str = JSON.stringify(obj)
    await this.mergeUpdate(str, time)
  }
  async read(syncTime?: number) {
    this.updateTime(syncTime)
    let str = await readData(this.filepath)

    if (str.length === 0) {
      await this.write({})
      this.updateTime()
      str = await readData(this.filepath)
    }
    const result = JSON.parse(str)
    return result
  }

  watcher = ({ mtime }: { mtime: Date }) => {
    const newTime = mtime.getTime()
    const needUpdate = this.syncTime < newTime
    console.log(`watch curr`,
                needUpdate,
                mtime.toTimeString(),
                this.syncTimeString)
    if (needUpdate) {
      this.read(newTime).then(
        update => console.log('update', update)
      )
    }
  }
}

class FileStorageInstance {
  store: Map<string, any> = new Map
  driver: FileSystemDriver
  constructor(filepath: string, store: { [key: string]: any }) {
    this.driver = new FileSystemDriver(filepath)
    this.save(store)
  }
  async save() {
    const obj = fromPairs([...this.store.entries()])
    await this.driver.write(obj)
  }
  load(obj: any) {
    this.store.clear()
    for (const [key, value] of toPairs(obj))
      this.store.set(key, value)
  }

  get(key: string) {
    return Promise.resolve(this.store.get(key))
  }
  set(key: string, val: any) {
    this.store.set(key, val)
    return Promise.resolve()
  }
  remove(...keys: string[]) {
    return Promise.resolve(
      keys.map(
        key => this.store.delete(key)))
  }
  clear() {
    this.store.clear()
    return Promise.resolve()
  }
}

/*const initializeFileStorage = async (filepath: string) => {
  let needToCreate = false
  try {
    await checkAccess(filepath)
  } catch (err) {
    switch (err.code) {
      case 'ENOENT': needToCreate = true; break
      case 'EPERM' : throw err
      default: throw err
    }
  }
  if (needToCreate)
    await createFile(filepath)

  const storage = new FileStorageInstance(filepath, {})
  return storage
  // await pause(5e3)

  // const readed = await storage.read()

  // console.log(`readed`, storage.syncTimeString, readed)

  // readed.field = { value: 'field' }
  // readed.data = ['str', 48, { ok: null }]

  // await pause()

  // await storage.write(readed)

  // await pause(5e3)

  // const newReaded = await storage.read()

  // console.log(`newReadedObj`, storage.syncTimeString, newReaded)

}*/



// export const FileStorage = (filepath: string): Promise<AsyncStorage> =>
//   initializeFileStorage(filepath)

export default FileStorageInstance