function GET(url, callback) {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.withCredentials = true;
  xhr.responseType = 'blob'; // or xhr.responseType = "blob";
  xhr.send();

  xhr.onload = function (e) {
    if (xhr.status !== 200) {
      alert('Unexpected status code ' + xhr.status + ' for ' + url);
      return false;
    }
    callback(new Blob([xhr.response])); // or new Blob([xhr.response]);
  };
}

const download = (fileName, blob) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};

const $pdfDownload = document.getElementById('pdfDownload');
const $videoDownload = document.getElementById('videoDownload');
const $imageDownload = document.getElementById('imageDownload');

$pdfDownload.addEventListener('click', (event) => {
  event.preventDefault();
  GET('/assets/des.pdf', (blob) => {
    download('des.pdf', blob);
  });
});

$imageDownload.addEventListener('click', (event) => {
  event.preventDefault();
  GET('/assets/des.jpeg', (blob) => {
    download('des.jpeg', blob);
  });
});

$videoDownload.addEventListener('click', (event) => {
  event.preventDefault();
  GET('/assets/mov_bbb.mp4', (blob) => {
    console.log(blob);
    download('mov_bbb.mp4', blob);
  });
});
