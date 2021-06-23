import { ID, checkSum } from '../utils';
import progressBarTpl from '../templates/progressBar.tpl';

const $fileUpload = $('#fileUpload');
const $progressBarBody = $('#progressBarBody');
const $emptyArea = $('#emptyArea');

class Upload {
  constructor(checksum, chunks, file) {
    this.checksum = checksum;
    this.chunks = chunks;
    this.file = file;
  }

  _getCurrentLoaded(progresses) {
    return progresses.reduce((total, cur) => {
      total += cur;
      return total;
    }, 0);
  }

  _showProgress(id, percent, text = 'done') {
    // for some reason, progressEvent.loaded bytes will greater than file size
    const isDone = Number(percent) >= 100;
    const ratio = isDone ? 100 : percent;
    $(`#progressBar${id}`).css('width', `${ratio}%`);
    $(`#percent${id}`).text(`${ratio}%`);
    if (isDone) {
      $(`#flag${id}`).text(text);
      $(`#pause${id}`).hide();
      $(`#cancel${id}`).hide();
    }
  }

  _renderProgressBar(id) {
    const filename = this.file.name;
    if (!$(`#progressBar${id}`).length) {
      // if html of progress bar is not exists, then render it
      const html = progressBarTpl.replace(/\{\{\s*name\s*\}\}/g, filename).replace(/\{\{\s*checksum\s*\}\}/g, id);
      $progressBarBody.append($(html));
      if ($emptyArea.length > 0) {
        $emptyArea.remove();
      }
    }
  }

  _isChunkExists(chunkId) {
    const params = { checksum: this.checksum, chunkId };
    return axios
      .get('/chunk/exist', { params })
      .then((res) => {
        const data = res.data;
        return data.code === 200 && data.data && !!data.data.id;
      })
      .catch((err) => {
        console.error(`check chunk exists ${checksum} - ${chunkId} error`, err);
      });
  }

  _chunkUploadTask(params) {
    const { chunk, chunkId, progresses } = params;
    const fd = new FormData();
    fd.append('file', chunk);
    fd.append('checksum', this.checksum);
    fd.append('chunkId', chunkId.toString());

    return axios({
      url: '/upload',
      method: 'post',
      data: fd,
      onUploadProgress: (progressEvent) => {
        progresses[chunkId] = progressEvent.loaded;
        const percent = ((this._getCurrentLoaded(progresses) / this.file.size) * 100).toFixed(0);
        this._showProgress(this.checksum, percent);
      },
    })
      .then((res) => res.data)
      .catch((err) => {
        console.error(`upload chunk ${this.checksum} - ${chunkId} error`, err);
      });
  }

  isFileExists() {
    return axios
      .get('/file/exist', { params: { checksum: this.checksum } })
      .then((res) => {
        const data = res.data;
        if (data.code === 200 && data.data) {
          this.serverFiles = data.data.files;
          return data.data.exists;
        }
        return false;
      })
      .catch((err) => {
        console.error(`check file exists ${this.checksum} error`, err);
      });
  }

  async uploadFile() {
    const filename = this.file.name;
    const tasks = [];
    const progresses = Array(this.chunks.length).fill(0);
    this._renderProgressBar(this.checksum);

    for (const chunk of this.chunks) {
      const chunkId = this.chunks.indexOf(chunk);
      const chunkExists = await this._isChunkExists(chunkId);
      if (!chunkExists) {
        const task = this._chunkUploadTask({ chunk, chunkId, progresses });
        tasks.push(task);
      } else {
        progresses[chunkId] = chunk.size;
      }
    }

    Promise.all(tasks).then(() => {
      const data = { chunks: this.chunks.length, filename, checksum: this.checksum };
      axios({ url: '/makefile', method: 'post', data })
        .then((res) => {
          if (res.code === 200) {
            console.log(`file ${filename} upload successfully!`);
          }
        })
        .catch((err) => {
          console.error(`file ${filename} upload error`, err);
        });
    });
  }

  uploadFileInSecond() {
    const id = ID();
    const filename = this.file.name;
    this._renderProgressBar(id);

    const names = this.serverFiles.map((file) => file.name);
    if (names.indexOf(filename) === -1) {
      const sourceFilename = names[0];
      const targetFilename = filename;

      this._showProgress(id, 100, 'done in second');
      axios({
        url: '/copyfile',
        method: 'get',
        params: { targetFilename, sourceFilename, checksum: this.checksum },
      })
        .then((res) => {
          if (res.code === 200) {
            console.log(`file ${filename} upload successfully!`);
          }
        })
        .catch((err) => {
          console.error(`file ${filename} upload error`, err);
        });
    } else {
      this._showProgress(id, 100, 'existed');
    }
  }
}

$fileUpload.on('change', async (event) => {
  const file = event.target.files[0];
  const { chunks, checksum } = await checkSum(file);
  const upload = new Upload(checksum, chunks, file);
  const exists = await upload.isFileExists();

  // trigger onchange when choose same file
  event.target.value = '';

  if (!exists) {
    await upload.uploadFile();
  } else {
    upload.uploadFileInSecond();
  }
});
