const { resolve } = require("path");
const { build } = require("esbuild");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2));
const pkgName = args._[0];
const targetFormat = args.f.startsWith("global")
  ? "iife"
  : args.f.startsWith("cjs")
  ? "cjs"
  : "esm";
const pkg = require(resolve(__dirname, `../packages/${pkgName}/package.json`));
const { name, format } = pkg.buildOptions;
const outfile = resolve(__dirname, `../packages/${pkgName}/dist/${pkgName}.${targetFormat}.js`)

build({
    entryPoints: [resolve(__dirname, `../packages/${pkgName}/src/index.ts`)],
    bundle: true,
    write: true,
    outfile: outfile,
    format: targetFormat,
    sourcemap: true,
    globalName: name,
    platform: targetFormat === 'cjs' ? 'node' : 'browser',
    watch: {
        onRebuild(error) {
            if(!error) {
                console.log('rebuilding...')
            }
        }
    }
}).then(() => {
    console.log('watching')
})