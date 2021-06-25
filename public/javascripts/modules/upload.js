import $ from 'jquery';
import axios from 'axios';
import { fileStatus, LIMITED_FILE_SIZE, uploadClasses } from '../constants';
import { ID, checkSum, toastr } from '../utils';
import progressBarTpl from '../templates/progressBar.tpl';

const $fileUpload = $('#fileUpload');
const $progressBarBody = $('#progressBarBody');
const $emptyArea = $('#emptyArea');
const CancelToken = axios.CancelToken;

class Upload {
  constructor(checksum, chunks, file) {
    this.checksum = checksum;
    this.chunks = chunks;
    this.file = file;
    this.serverFiles = [];
    this.cancelers = [];
    this.progresses = Array(this.chunks.length).fill(0);
  }

  _getCurrentLoaded() {
    return this.progresses.reduce((total, cur) => {
      total += cur;
      return total;
    }, 0);
  }

  _setProgressBar(status, id) {
    const $progressBar = $(`#progressBar${id}`);
    const $progressBarOuter = $progressBar.parent('div');
    const $percent = $(`#percent${id}`);
    const $flag = $(`#flag${id}`);
    if (status === fileStatus.UPLOADING) {
      const addUploadingClass = ($ele, className) => {
        if (!$ele.hasClass(uploadClasses.UPLOADING[className])) {
          $ele.removeClass(uploadClasses.CANCELED[className]);
          $ele.addClass(uploadClasses.UPLOADING[className]);
        }
      };
      addUploadingClass($progressBarOuter, 'progressBarOuter');
      addUploadingClass($progressBar, 'progressBarInner');
      addUploadingClass($percent, 'percent');
      addUploadingClass($flag, 'flag');
      $flag.text(fileStatus.UPLOADING);
    } else if (status === fileStatus.CANCELED) {
      const addCanceledClass = ($ele, className) => {
        if (!$ele.hasClass(uploadClasses.CANCELED[className])) {
          $ele.removeClass(uploadClasses.UPLOADING[className]);
          $ele.addClass(uploadClasses.CANCELED[className]);
        }
      };
      addCanceledClass($progressBarOuter, 'progressBarOuter');
      addCanceledClass($progressBar, 'progressBarInner');
      addCanceledClass($percent, 'percent');
      addCanceledClass($flag, 'flag');
    }
  }

  _showProgress(id, percent, text = fileStatus.DONE) {
    // for some reason, progressEvent.loaded bytes will greater than file size
    const isUploadChunkDone = Number(percent) >= 100;

    // 1% to make file
    const ratio = isUploadChunkDone ? 99 : percent;
    this._setProgressBar(fileStatus.UPLOADING, id);
    $(`#progressBar${id}`).css('width', `${ratio}%`);
    $(`#percent${id}`).text(`${ratio}%`);
    if (isUploadChunkDone) {
      $(`#flag${id}`).text(fileStatus.MAKE_FILE);
      $(`#cancel${id}`).hide();
    }
  }

  _uploadDone(id) {
    $(`#percent${id}`).text('100%');
    $(`#progressBar${id}`).css('width', '100%');
    $(`#flag${id}`).text(fileStatus.DONE);
  }

  _cancelProgress(id) {
    $(`#flag${id}`).text('canceled');
    this._setProgressBar(fileStatus.CANCELED, id);
  }

  _renderProgressBar(id) {
    const filename = this.file.name;
    if (!$(`#progressBar${id}`).length) {
      // if html of progress bar is not exists, then render it
      const html = progressBarTpl.replace(/\{\{\s*name\s*\}\}/g, filename).replace(/\{\{\s*id\s*\}\}/g, id);
      $progressBarBody.append($(html));

      // bind cancel event
      const $cancel = $(`#cancel${id}`);
      $cancel.on('click', async () => {
        const status = $cancel.data('status');
        if (status === 'cancel') {
          $cancel.data('status', 'resume');
          $cancel.text('Resume');
          this.cancelUpload();
        } else {
          $cancel.data('status', 'cancel');
          $cancel.text('Cancel');
          await this.uploadFile();
        }
      });

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
    let canceler;
    const { chunk, chunkId } = params;
    const fd = new FormData();
    const chunkName = `${chunkId}.${this.checksum}.chunk`;
    fd.append(chunkName, chunk);
    fd.append('checksum', this.checksum);
    fd.append('chunkId', chunkId.toString());

    return axios({
      url: '/upload',
      method: 'post',
      data: fd,
      onUploadProgress: (progressEvent) => {
        const chunkProgress = this.progresses[chunkId];
        const loaded = progressEvent.loaded;
        this.progresses[chunkId] = loaded >= chunkProgress ? loaded : chunkProgress;

        const percent = ((this._getCurrentLoaded(this.progresses) / this.file.size) * 100).toFixed(0);
        this._showProgress(this.checksum, percent);
      },
      cancelToken: new CancelToken((c) => {
        // An executor function receives a cancel function as a parameter
        canceler = c;
        this.cancelers.push(canceler);
      }),
    })
      .then((res) => {
        const cancelerIndex = this.cancelers.indexOf(canceler);
        this.cancelers.splice(cancelerIndex, 1);
        return res.data;
      })
      .catch(() => {
        this._cancelProgress(this.checksum);
        axios
          .delete('/chunk/delete', { params: { checksum: this.checksum, chunkId } })
          .then((res) => res.data)
          .catch((err) => {
            console.error(`delete chunk ${this.checksum} - ${chunkId} error`, err);
          });
      });
  }

  cancelUpload() {
    if (this.cancelers.length > 0) {
      for (const canceler of this.cancelers) {
        canceler();
      }
    }
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
    this._renderProgressBar(this.checksum);

    for (let chunkId = 0; chunkId < this.chunks.length; chunkId++) {
      const chunk = this.chunks[chunkId];
      const chunkExists = await this._isChunkExists(chunkId);
      if (!chunkExists) {
        const task = this._chunkUploadTask({ chunk, chunkId });
        tasks.push(task);
      } else {
        this.progresses[chunkId] = chunk.size;
      }
    }

    Promise.all(tasks).then(() => {
      const data = { chunks: this.chunks.length, filename, checksum: this.checksum };
      axios({ url: '/makefile', method: 'post', data })
        .then((res) => {
          if (res.data.code === 200) {
            this._uploadDone(this.checksum);
            toastr.success(`file ${filename} upload successfully!`);
          }
        })
        .catch((err) => {
          console.error(err);
          toastr.error(`file ${filename} upload failed!`);
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

      this._showProgress(id, 100, fileStatus.DONE_IN_SECOND);
      axios({
        url: '/copyfile',
        method: 'get',
        params: { targetFilename, sourceFilename, checksum: this.checksum },
      })
        .then((res) => {
          if (res.data.code === 200) {
            toastr.success(`file ${filename} upload successfully!`);
          }
        })
        .catch((err) => {
          console.error(err);
          toastr.error(`file ${filename} upload failed!`);
        });
    } else {
      this._showProgress(id, 100, fileStatus.EXISTED);
      toastr.success(`file ${filename} has existed`);
    }
  }
}

$fileUpload.on('change', async (event) => {
  const file = event.target.files[0];

  // trigger onchange when choose same file
  event.target.value = '';

  if (file.size > LIMITED_FILE_SIZE) {
    toastr.warning('file size greater than 50MB');
  } else {
    const { chunks, checksum } = await checkSum(file);
    const upload = new Upload(checksum, chunks, file);
    const exists = await upload.isFileExists();

    if (!exists) {
      await upload.uploadFile();
    } else {
      upload.uploadFileInSecond();
    }
  }
});
