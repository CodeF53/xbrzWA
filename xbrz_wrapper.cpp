#include <cstddef>
#include <cstdint>
#include <limits>
#include "xbrz/xbrz.h"
#include "xbrz/xbrz_config.h"

extern "C" {
  void xbrz_scale(size_t factor, const uint32_t* src, uint32_t* trg, int srcWidth, int srcHeight, int colFmt, int yFirst, int yLast) {
    // hacky fix to not being able to pass a config struct from JS
    xbrz::ScalerCfg cfg;

    xbrz::ColorFormat colorFormat = static_cast<xbrz::ColorFormat>(colFmt);
    xbrz::scale(factor, src, trg, srcWidth, srcHeight, colorFormat, cfg, yFirst, yLast);
  }

  // Dummy main function to satisfy the linker
  int main() { return 0; }
}
