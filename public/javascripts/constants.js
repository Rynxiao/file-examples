export const CHUNK_SIZE = 1024 * 1024 * 2;
export const LIMITED_FILE_SIZE = 1024 * 1024 * 50;

export const fileStatus = {
  UPLOADING: 'Task In Progress',
  DONE: 'Done',
  MAKE_FILE: 'Making File...',
  FILE_IN_SERVER: 'File In Server',
  EXISTED: 'Existed',
  CANCELED: 'Canceled',
  DONE_IN_SECOND: 'Done In Second',
};

export const uploadClasses = {
  UPLOADING: {
    progressBarOuter: 'bg-emerald-200',
    progressBarInner: 'bg-emerald-500',
    percent: 'text-emerald-600',
    flag: 'bg-emerald-200 text-emerald-600',
    chunkProgress: 'bg-green-500',
  },
  CANCELED: {
    progressBarOuter: 'bg-pink-200',
    progressBarInner: 'bg-pink-500',
    percent: 'text-pink-600',
    flag: 'bg-pink-200 text-pink-600',
    chunkProgress: 'bg-pink-500',
  },
};
