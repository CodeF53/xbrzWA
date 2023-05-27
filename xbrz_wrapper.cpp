#include <cstddef>
#include <cstdint>
#include <limits>
#include "xbrz/xbrz.h"
#include "xbrz/xbrz_config.h"

extern "C" {
  uint32_t* xbrz_scale(size_t factor, const uint32_t* src, int srcWidth, int srcHeight, int colFmt, int yFirst, int yLast) {
    // hacky fix to not being able to pass a config struct from JS
    xbrz::ScalerCfg cfg;

    // alternative to passing in an array for it to fill
    size_t trgLength = srcWidth * srcHeight * factor * factor;
    uint32_t* trg = new uint32_t[trgLength];

    xbrz::ColorFormat colorFormat = static_cast<xbrz::ColorFormat>(colFmt);
    xbrz::scale(factor, src, trg, srcWidth, srcHeight, colorFormat, cfg, yFirst, yLast);

    return trg;
  }

  // Dummy main function to satisfy the linker
  int main() { return 0; }
}
