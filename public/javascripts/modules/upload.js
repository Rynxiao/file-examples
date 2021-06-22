import { CHUNK_SIZE } from '../constants';
import progressBarTpl from '../templates/progressBar.tpl';

const $fileUpload = $('#fileUpload');
const $progressBarBody = $('#progressBarBody');
const $emptyArea = $('#emptyArea');

const checkSum = (file, piece = CHUNK_SIZE) => {
  return new Promise((resolve, reject) => {
    let totalSize = file.size;
    let start = 0;
    const chunks = [];
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    const loadNext = () => {
      const end = start + piece;
      const chunk = file.slice(start, end);

      start = end;
      chunks.push(chunk);
      fileReader.readAsArrayBuffer(chunk);
    };

    fileReader.onload = (event) => {
      const buffer = event.target.result;

      if (start < totalSize) {
        spark.append(buffer);
        loadNext();
      } else {
        const checksum = spark.end();
        resolve({ chunks, checksum });
      }
    };

    fileReader.onerror = () => {
      console.warn('oops, something went wrong.');
      reject();
    };

    loadNext();
  });
};

const isFileExists = (checksum) =>
  axios.get('/file/exist', { params: { checksum } }).then((res) => {
    const data = res.data;
    return data.code === 200 && data.data && !!data.data.id;
  });

const isChunkExists = (checksum, chunkId) =>
  axios.get('/chunk/exist', { params: { checksum, chunkId } }).then((res) => {
    const data = res.data;
    return data.code === 200 && data.data && !!data.data.id;
  });

const getCurrentLoaded = (progresses) =>
  progresses.reduce((total, cur) => {
    total += cur;
    return total;
  }, 0);

const showProgress = (checksum, percent, text = 'done') => {
  // for some reason, progressEvent.loaded bytes will greater than file size
  const isDone = Number(percent) >= 100;
  const ratio = isDone ? 100 : percent;
  $(`#progressBar${checksum}`).css('width', `${ratio}%`);
  $(`#percent${checksum}`).text(`${ratio}%`);
  if (isDone) {
    $(`#flag${checksum}`).text(text);
    $(`#pause${checksum}`).hide();
    $(`#cancel${checksum}`).hide();
  }
};

const chunkUploadTask = (options) => {
  const { chunk, checksum, index, progresses, fileSize } = options;
  const fd = new FormData();
  fd.append('file', chunk);
  fd.append('checksum', checksum);
  fd.append('chunkId', index.toString());

  return axios({
    url: '/upload',
    method: 'post',
    data: fd,
    onUploadProgress: (progressEvent) => {
      progresses[index] = progressEvent.loaded;
      const percent = ((getCurrentLoaded(progresses) / fileSize) * 100).toFixed(0);
      showProgress(checksum, percent);
    },
  }).then((res) => res.data);
};

const renderProgressBar = (filename, checksum) => {
  if (!$(`#progressBar${checksum}`).length) {
    // if html of progress bar is not exists, then render it
    const html = progressBarTpl.replace(/\{\{\s*name\s*\}\}/g, filename).replace(/\{\{\s*checksum\s*\}\}/g, checksum);
    $progressBarBody.append($(html));
    $emptyArea.remove();
  }
};

$fileUpload.on('change', async (event) => {
  const file = event.target.files[0];
  const { chunks, checksum } = await checkSum(file);
  const fileExists = await isFileExists(checksum);

  // trigger onchange when choose same file
  event.target.value = '';

  renderProgressBar(file.name, checksum);

  if (!fileExists) {
    const tasks = [];
    const progresses = Array(chunks.length).fill(0);

    for (const chunk of chunks) {
      const index = chunks.indexOf(chunk);
      const chunkExists = await isChunkExists(checksum, index);
      if (!chunkExists) {
        tasks.push(chunkUploadTask({ chunk, checksum, index, progresses, fileSize: file.size }));
      } else {
        progresses[index] = chunk.size;
      }
    }

    Promise.all(tasks).then(() => {
      const filename = file.name;
      axios({ url: '/makefile', method: 'post', data: { chunks: chunks.length, filename, checksum } });
    });
  } else {
    showProgress(checksum, 100, 'done in second');
  }
});
