const crypto = require('crypto')
const fs = require('fs')
const sharp = require('sharp')
const natsort = require('./natsort')
const { promisify } = require('util')

const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
let sets, bgsets, colors
class Robohash {
  constructor(string, hashcount = 11, ignoreext = true) {
    if (ignoreext) {
      // TODO
      // string = removeExt(string)
    }

    this.hexdigest = crypto.createHash('sha512').update(string).digest('hex')
    this.hasharray = []

    this.iter = 4
    this.createHash(hashcount)

    this.format = 'png'
  }

  createHash(count) {
    for (let i = 0; i < count; i++) {
      let blocksize = parseInt(this.hexdigest.length / count)
      let currentstart = (1 + i) * blocksize - blocksize
      let currentend = (1 + i) * blocksize
      this.hasharray.push(parseInt(this.hexdigest.slice(currentstart, currentend), 16))
    }
  }

  async listDir(path) {
    return (await readdir(path)).filter(async (file) => (await stat(path + '/' + file)).isDirectory())
  }

  async getListOfFiles(path) {
    let chosenFiles = []

    const directories = (await readdir(path)).filter(async (file) => (await stat(path + '/' + file)).isDirectory()).map(file => path + '/' + file)
    for (let i = 0; i < directories.length; i++) {
      const dir = directories[i]
      const filesInDir = (await readdir(dir)).filter(async (file) => (await stat(dir + '/' + file)).isFile()).sort().map(file => dir + '/' + file)
      const elementInList = this.hasharray[this.iter] % filesInDir.length
      chosenFiles.push(filesInDir[elementInList])
      this.iter++
    }
    return chosenFiles
  }

  async assemble(roboset, color, format, bgset, sizex = 300, sizey = 300) {
    sets = sets || this.listDir(`${__dirname}/sets`)
    bgsets = bgsets || this.listDir(`${__dirname}/backgrounds`)
    colors = colors || this.listDir(`${__dirname}/sets/set1`)

    this.sets = await sets
    this.bgsets = await bgsets
    this.colors = await colors

    if (roboset === 'any') roboset = this.sets[this.hasharray[1] % this.sets.length]
    else if (!this.sets.includes(roboset)) roboset = this.sets[0]

    if (roboset === 'set1') {
      if (this.sets.includes(color)) {
        roboset = 'set1/' + color
      } else {
        const randomcolor = this.colors[this.hasharray[0] % this.colors.length]
        roboset = 'set1/' + randomcolor
      }
    }

    if (!this.bgsets.includes(bgset)) bgset = this.bgsets[this.hasharray[2] % this.bgsets.length]

    if (!format) format = this.format

    const roboparts = (await this.getListOfFiles(`${__dirname}/sets/${roboset}`)).sort(natsort)
    let roboimage = await roboparts.slice(1).reduce(async (input, part) => {
      const data = await input
      return sharp(data).overlayWith(part).toBuffer()
    }, sharp(roboparts[0]).toBuffer())
    return sharp(roboimage).resize(sizex, sizey).raw().toFormat('png').toBuffer()
  }
}

module.exports = Robohash
