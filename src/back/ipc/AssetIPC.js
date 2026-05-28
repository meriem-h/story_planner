const BaseIPC = require('./baseIpc')
const AssetRepository = require('../database/AssetRepository')

class AssetIPC extends BaseIPC {
    constructor() {
        super('asset', new AssetRepository())
    }
}

module.exports = new AssetIPC()