const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Firebase ESM/CJS registry fix.
 *
 * Problem: Metro'nun "browser" field tercihiyle yüklenen ESM modülleri
 * farklı @firebase/component instance'ları oluşturuyor → auth register olamıyor.
 *
 * Çözüm:
 *  - @firebase/component → her zaman CJS (paylaşılan tek registry)
 *  - firebase/auth, @firebase/auth, firebase/app, @firebase/app → CJS (auth fix)
 *  - firebase/database, firebase/storage → default (browser ESM, Node stream yok)
 *  - @firebase/database, @firebase/storage → browser ESM bırak (Node deps yok)
 *
 * Anahtar mantık: @firebase/component her zaman CJS'e yönlendirildiğinden,
 * ESM modüller (@firebase/storage, @firebase/database) bile import ettiğinde
 * aynı CJS registry instance'ını alır → component'ler düzgün register olur.
 */

const nm = (p) => path.resolve(__dirname, 'node_modules', p);

const CJS_MAP = {
  // App + Auth → CJS (component registration için kritik)
  'firebase/app':        nm('firebase/app/dist/index.cjs.js'),
  'firebase/auth':       nm('firebase/auth/dist/index.cjs.js'),
  '@firebase/app':       nm('@firebase/app/dist/index.cjs.js'),
  '@firebase/auth':      nm('@firebase/auth/dist/node/index.js'),

  // Paylaşılan registry — KRİTİK, her modülün aynı instance'ı alması şart
  '@firebase/component': nm('@firebase/component/dist/index.cjs.js'),
  '@firebase/util':      nm('@firebase/util/dist/index.node.cjs.js'),
  '@firebase/logger':    nm('@firebase/logger/dist/index.cjs.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (CJS_MAP[moduleName]) {
    return {
      filePath: CJS_MAP[moduleName],
      type: 'sourceFile',
    };
  }
  // firebase/database ve firebase/storage → Metro default (browser ESM)
  // Node.js stream/fetch modülleri içermiyor
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
