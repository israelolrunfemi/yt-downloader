import { useState, useEffect} from 'react';
import axios from 'axios';
import './App.css';


function App() {
    const [url, setUrl] = useState('');
    const [videoInfo, setVideoInfo] = useState(null);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
      if (url) {
        fetchVideoInfo();
      }
    }, [url]);

    const fetchVideoInfo = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/video-info?url=${url}`);
        setVideoInfo(response.data);
        setSelectedFormat(null);
      } catch (error) {
        console.error('Error fetching video info:', error);
      }
      setIsLoading(false);
    };

    const handleDownload = async () => {
      if (!selectedFormat) return;

      setIsDownloading(true);
      try {
        const response = await axios({
          url: `http://localhost:5000/download?url=${url}&itag=${selectedFormat.itag}&format=${selectedFormat.format}`,
          method: 'GET',
          responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${videoInfo.title}.${selectedFormat.format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Error downloading video:', error);
      }
      setIsDownloading(false);
    };

    return (
      <div className="App">
        <h1>YouTube Video Downloader</h1>
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter YouTube URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        {isLoading && <p className="loading">Loading video information...</p>}
        {videoInfo && (
          <div className="video-info">
            <h2>{videoInfo.title}</h2>
            <div className="thumbnail-container">
              <img src={videoInfo.thumbnail} alt={videoInfo.title} className="video-thumbnail" />
            </div>
            <div className="formats-container">
              <div className="format-list">
                <h3>Video Formats:</h3>
                <ul>
                  {videoInfo.formats.map((format) => (
                    <li key={format.itag}>
                      <button
                        onClick={() => setSelectedFormat({ ...format, format: 'mp4' })}
                        className={selectedFormat?.itag === format.itag ? 'selected' : ''}
                      >
                        {format.quality} - {format.mimeType.split(';')[0]}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="format-list">
                <h3>Audio Formats:</h3>
                <ul>
                  {videoInfo.audioFormats.map((format) => (
                    <li key={format.itag}>
                      <button
                        onClick={() => setSelectedFormat({ ...format, format: 'mp3' })}
                        className={selectedFormat?.itag === format.itag ? 'selected' : ''}
                      >
                        {format.quality} - {format.mimeType.split(';')[0]}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        {selectedFormat && (
          <div className="download-section">
            <p>Selected format: {selectedFormat.quality} - {selectedFormat.mimeType.split(';')[0]}</p>
            <button onClick={handleDownload} className="download-button" disabled={isDownloading}>
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
          </div>
        )}
      </div>
    );
  }
export default App;
