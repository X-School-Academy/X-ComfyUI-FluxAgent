# Setup

```bash
mkdir codemirror_bundler
cd codemirror_bundler
npm init -y
npm install codemirror @codemirror/basic-setup @codemirror/lang-javascript
npm install --save-dev esbuild
```

### Create the JS entry point (src/index.js)

### Configure your build in package.json

> add build to scripts

```
  "scripts": {
    "build": "esbuild src/index.js --bundle --outfile=src/codemirror_bundle.js --format=esm"
  }
````

## Build and use src/codemirror_bundle.js into your in your project

```bash
npm run build
```


