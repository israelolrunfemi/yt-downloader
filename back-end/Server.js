const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/video-info', async (req, res) => {
  try {
    const { url } = req.query;
    const info = await ytdl.getInfo(url);

    // Filter and sort video formats
    const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio')
      .concat(ytdl.filterFormats(info.formats, 'videoonly'))
      .sort((a, b) => {
        const resA = parseInt(a.qualityLabel) || 0;
        const resB = parseInt(b.qualityLabel) || 0;
        return resB - resA;
      });

    // Filter audio formats
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      formats: videoFormats.map(f => ({
        itag: f.itag,
        quality: f.qualityLabel || (f.height ? `${f.height}p` : 'Unknown'),
        mimeType: f.mimeType,
        hasAudio: f.hasAudio
      })),
      audioFormats: audioFormats.map(f => ({
        itag: f.itag,
        quality: f.audioBitrate + 'kbps',
        mimeType: f.mimeType
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.get('/download', async (req, res) => {
  try {
    const { url, itag, format } = req.query;
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

    res.header('Content-Disposition', `attachment; filename="${title}.${format}"`);

    if (format === 'mp3') {
      ytdl(url, { quality: itag, filter: 'audioonly' }).pipe(res);
    } else {
      const selectedFormat = ytdl.chooseFormat(info.formats, { quality: itag });
      if (selectedFormat.hasAudio) {
        ytdl(url, { quality: itag }).pipe(res);
      } else {
        // For video-only formats, we need to merge with audio
        const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        const videoStream = ytdl(url, { quality: itag });
        const audioStream = ytdl(url, { quality: audioFormat.itag });

      
        videoStream.pipe(res);
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
