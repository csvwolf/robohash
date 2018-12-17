const crypto = require('crypto')
const fs = require('fs')
const sharp = require('sharp')
class Robohash {
  constructor(string, hashcount = 11, ignoreext = true) {
    if (ignoreext) {
      // string = removeExt(string)
    }

    this.hexdigest = crypto.createHash('sha512').update(string).digest('hex')
    this.hasharray = []

    this.iter = 4
    this.createHash(hashcount)
    this.sets = this.listDir(`${__dirname}/sets`)
    this.bgsets = this.listDir(`${__dirname}/backgrounds`)
    this.colors = this.listDir(`${__dirname}/sets/set1`)

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

  listDir(path) {
    return fs.readdirSync(path).filter((file) => fs.statSync(path + '/' + file).isDirectory())
  }

  getListOfFiles(path) {
    let chosenFiles = []

    const directories = fs.readdirSync(path).filter((file) => fs.statSync(path + '/' + file).isDirectory()).map(file => path + '/' + file)
  
    directories.forEach(dir => {
      const filesInDir = fs.readdirSync(dir).filter((file) => fs.statSync(dir + '/' + file).isFile()).map(file => dir + '/' + file)
      const elementInList = this.hasharray[this.iter] % filesInDir.length
      chosenFiles.push(filesInDir[elementInList])
      this.iter++
    })

    return chosenFiles
  }

  async assemble(roboset, color, format, bgset, sizex, sizey) {
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

    const roboparts = this.getListOfFiles(`${__dirname}/sets/${roboset}`)
    let roboimage = await roboparts.slice(1).reverse().reduce(async (input, part) => {
      const data = await input
      return sharp(data).overlayWith(part).toBuffer()
    }, sharp(roboparts[0]).toBuffer())
    sharp(roboimage).raw().toFormat('png').toFile('./output.png')
  }
}

module.exports = Robohash
