import $ from 'jquery';
import axios from 'axios';
import { fileStatus, LIMITED_FILE_SIZE, uploadClasses } from '../constants';
import { ID, checkSum, toastr } from '../utils';
import progressBarTpl from '../templates/progressBar.tpl';
import chunkProgressBarTpl from '../templates/chunkProgressBar.tpl';

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
    this.status = fileStatus.UPLOADING;
  }

  _addEvents() {
    // click cancel button
    $('#progressBarBody .cancel').on('click', (event) => {
      const $this = $(event.target);
      $this.removeClass('visible').addClass('invisible');
      $this.next('.resume').removeClass('invisible').addClass('visible');

      this.status = fileStatus.CANCELED;
      if (this.cancelers.length > 0) {
        for (const canceler of this.cancelers) {
          canceler();
        }
      }
    });

    // click resume button
    $('#progressBarBody .resume').on('click', async (event) => {
      const $this = $(event.target);
      $this.removeClass('visible').addClass('invisible');
      $this.prev('.cancel').removeClass('invisible').addClass('visible');

      this.status = fileStatus.UPLOADING;
      await this.uploadFile();
    });
  }

  _getCurrentLoaded() {
    return this.progresses.reduce((total, cur) => {
      total += cur;
      return total;
    }, 0);
  }

  _setDoneProgress(id, text) {
    const $progressBar = $(`#progressBar${id}`);
    const $percent = $(`#percent${id}`);
    const $flag = $(`#flag${id}`);
    const $cancel = $(`#cancel${id}`);

    $percent.text('100%');
    $progressBar.css('width', '100%');
    $flag.text(text);
    $cancel.removeClass('visible').addClass('invisible');
  }

  _setUploadingProgress(id, percent) {
    // Sometimes, will still receive data which will change the progressBar when click the cancel button
    if (this.status === fileStatus.UPLOADING) {
      const $progressBar = $(`#progressBar${id}`);
      const $progressBarOuter = $progressBar.parent('div');
      const $chunkProgressBar = $(`#chunkProgressBar${id}`);
      const $percent = $(`#percent${id}`);
      const $flag = $(`#flag${id}`);
      const $cancel = $(`#cancel${id}`);
      // for some reason, progressEvent.loaded bytes will greater than file size
      const isUploadChunkDone = Number(percent) >= 100;
      // 1% to make file
      const ratio = isUploadChunkDone ? 99 : percent;

      const addUploadingClass = ($ele, className) => {
        if (!$ele.hasClass(uploadClasses.UPLOADING[className])) {
          $ele.removeClass(uploadClasses.CANCELED[className]);
          $ele.addClass(uploadClasses.UPLOADING[className]);
        }
      };
      $progressBar.css('width', `${ratio}%`);
      $percent.text(`${ratio}%`);
      $flag.text(fileStatus.UPLOADING);
      addUploadingClass($chunkProgressBar.children('.chunkProgress'), 'chunkProgress');
      addUploadingClass($progressBarOuter, 'progressBarOuter');
      addUploadingClass($progressBar, 'progressBarInner');
      addUploadingClass($percent, 'percent');
      addUploadingClass($flag, 'flag');

      if (isUploadChunkDone) {
        $flag.text(fileStatus.MAKE_FILE);
      }
    }
  }

  _setCanceledProgress(id) {
    if (this.status === fileStatus.CANCELED) {
      const $progressBar = $(`#progressBar${id}`);
      const $progressBarOuter = $progressBar.parent('div');
      const $chunkProgressBar = $(`#chunkProgressBar${id}`);
      const $percent = $(`#percent${id}`);
      const $flag = $(`#flag${id}`);

      const addCanceledClass = ($ele, className) => {
        if (!$ele.hasClass(uploadClasses.CANCELED[className])) {
          $ele.removeClass(uploadClasses.UPLOADING[className]);
          $ele.addClass(uploadClasses.CANCELED[className]);
        }
      };
      $flag.text(fileStatus.CANCELED);
      addCanceledClass($chunkProgressBar.children('.chunkProgress'), 'chunkProgress');
      addCanceledClass($progressBarOuter, 'progressBarOuter');
      addCanceledClass($progressBar, 'progressBarInner');
      addCanceledClass($percent, 'percent');
      addCanceledClass($flag, 'flag');
    }
  }

  _setUploadingChunkProgress(id, chunkId, percent) {
    const $chunkProgress = $(`#chunkProgress_${id}_${chunkId}`);
    $chunkProgress.css('width', `${percent}%`);
  }

  _renderProgressBar(id) {
    const filename = this.file.name;
    // if html of progress bar is not exists, then render it
    if (!$(`#progressBar${id}`).length) {
      const html = progressBarTpl.replace(/\{\{\s*name\s*\}\}/g, filename).replace(/\{\{\s*id\s*\}\}/g, id);
      $progressBarBody.append($(html));
      this._addEvents();

      if ($emptyArea.length > 0) {
        $emptyArea.remove();
      }
    }
  }

  _renderChunkProgressBar(id, chunkId) {
    const $chunkProgressBar = $(`#chunkProgressBar${id}`);
    const tpl = chunkProgressBarTpl.replace(/\{\{id\}\}/g, id).replace(/\{\{chunkId\}\}/g, chunkId);
    const $chunkProgress = $(`#chunkProgress_${id}_${chunkId}`);
    if (!$chunkProgress.length) {
      $chunkProgressBar.append($(tpl));
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
        const chunkPercent = ((loaded / progressEvent.total) * 100).toFixed(0);
        this.progresses[chunkId] = loaded >= chunkProgress ? loaded : chunkProgress;
        const percent = ((this._getCurrentLoaded(this.progresses) / this.file.size) * 100).toFixed(0);

        this._setUploadingProgress(this.checksum, percent);
        this._setUploadingChunkProgress(this.checksum, chunkId, chunkPercent);
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
      .catch((err) => {
        console.error(`chunk ${this.checksum} - ${chunkId} canceled to upload.`);
        this._setCanceledProgress(this.checksum);
        axios
          .delete('/chunk/delete', { params: { checksum: this.checksum, chunkId } })
          .then((res) => res.data)
          .catch((err) => {
            console.error(`delete chunk ${this.checksum} - ${chunkId} error`, err);
          });
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
    this._renderProgressBar(this.checksum);
    this.status = fileStatus.UPLOADING;

    for (let chunkId = 0; chunkId < this.chunks.length; chunkId++) {
      this._renderChunkProgressBar(this.checksum, chunkId);
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
            this._setDoneProgress(this.checksum, fileStatus.DONE);
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

      this._setDoneProgress(id, fileStatus.DONE_IN_SECOND);
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
      this._setDoneProgress(id, fileStatus.EXISTED);
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
