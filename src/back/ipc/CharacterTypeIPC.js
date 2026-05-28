const BaseIPC = require('./baseIpc')
const CharacterTypeRepository = require('../database/CharacterTypeRepository')

class CharacterTypeIPC extends BaseIPC {
    constructor() {
        super('character_type', new CharacterTypeRepository())
    }
}

module.exports = new CharacterTypeIPC()