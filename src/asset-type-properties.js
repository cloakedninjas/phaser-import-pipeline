module.exports = {
  spritesheet: {
    frameConfig: {
      frameWidth: 0,
      frameHeight: 0
    }
  },

  audio: (key, parts, stats, manifest) => {
    const prevEntry = manifest.assets.audio[key];
    const filePath = parts.join('/');

    if (!prevEntry) {
      manifest.assets.audio[key] = {
        file: filePath,
        size: stats.size
      };

      manifest.totalSize += stats.size;
    } else if (prevEntry.file !== filePath) {
      if (Array.isArray(prevEntry) && !prevEntry.includes(filePath)) {
        // append new entry to existing
        prevEntry.push(prevEntry);
      } else {
        // convert string entry to array
        prevEntry.file = [prevEntry.file, filePath];
      }

      manifest.totalSize -= prevEntry.size;
      prevEntry.size = Math.max(prevEntry.size, stats.size);
      manifest.totalSize += prevEntry.size;
    }
  }
}
