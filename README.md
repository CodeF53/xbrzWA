# WebAssembly xBRZ
An almost-perfect port of xBRZ to web using WASM.

Broken bits:
1. You can't specify options, so it always defaults to the ones found in `xbrz_config.h`

## Compiling Instructions
This assumes you already have WSL installed, if you don't, install it.

### Clone this git
```
git clone https://github.com/CodeF53/xbrzWA.git
cd xbrz
```

### Download the xBRZ source
1. Download [the latest xBRZ source](https://sourceforge.net/projects/xbrz/files/xBRZ/)
2. Extract it into a folder called `/xbrz` inside this repository
    - Structure should look like `xbrzWA/xbrz/xbrz.cpp`

Or run the following:
```
mkdir xbrz
cd xbrz
curl https://phoenixnap.dl.sourceforge.net/project/xbrz/xBRZ/xBRZ_1.8.zip | jar xv
cd ..
```

### Installing Emscripten
Inside of the root of this repository, run the following commands
```
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ..
```

### Compiling
```
em++ -O3 -s "EXPORTED_FUNCTIONS=['_xbrz_scale', '_malloc', '_free']" -o xbrz.wasm xbrz_wrapper.cpp ./xbrz/xbrz.cpp -I./xbrz -s TOTAL_MEMORY=512MB
```