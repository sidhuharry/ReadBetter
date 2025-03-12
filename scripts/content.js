const groupedWordsLength = 3;

const filterEmptyElm = (elms) =>
  elms.filter((el) => el.innerText && el.innerText !== '');

let ps = filterEmptyElm([...document.querySelectorAll('p')]);
let divs = filterEmptyElm([...document.querySelectorAll('div')]);

const Status = {
  UNREAD: 'unread',
  READ: 'read',
  ACTIVE: 'active',
};

// TODO: handle a website which is using <br> to create newlines rather than paragraphs or divs

// If there are no ps and add divs to readableElms
let readableElms = (
  ps.length === 0
    ? filterEmptyElm([
        ...document.querySelectorAll('div', 'li', 'tr', 'pre', 'code'),
      ])
    : filterEmptyElm([
        ...document.querySelectorAll('p', 'li', 'tr', 'pre', 'code'),
      ])
).map((elm) => ({
  elm: elm,
  status: Status.UNREAD,
  originalStyle: elm.style,
}));

function getObjectSizeInBytes(obj) {
  const str = JSON.stringify(obj);
  return new Blob([str]).size;
}

const sizeInBytes = getObjectSizeInBytes(readableElms);
console.log(`Size of readableElms in memory: ${sizeInBytes} bytes`);

let currentElmIdx = 0;

let currentParagraph = null;

// Initial paragraph and line highlight
highlightParagraph(currentElmIdx);

function markParagraphRead(index) {
  if (readableElms[index]) {
    readableElms[index].status = Status.READ;
  }
}

function markParagraphUnread(index) {
  if (readableElms[index]) {
    readableElms[index].status = Status.UNREAD;
    readableElms[index].elm.style = readableElms[index].originalStyle;
  }
}

// Handle keydown for navigating paragraphs and lines
document.addEventListener('keydown', (event) => {
  console.log(`event is: ${event.key} -- and shiftKey is: ${event.shiftKey}`);
  if (event.key === 'ArrowDown' && event.shiftKey) {
    // Move to the next paragraph
    if (currentElmIdx < readableElms.length - 1) {
      markParagraphRead(currentElmIdx);
      currentElmIdx++;
      highlightParagraph(currentElmIdx);
    }
  }

  if (event.key === 'ArrowUp' && event.shiftKey) {
    // Move to the previous paragraph
    if (currentElmIdx > 0) {
      markParagraphUnread(currentElmIdx);
      currentElmIdx--;
      highlightParagraph(currentElmIdx);
    }
  }
});

// Function to highlight the selected paragraph
function highlightParagraph(index) {
  console.log(`Total Readable Elms: ${JSON.stringify(readableElms)}`);
  if (readableElms[index]) {
    currentParagraph = readableElms[index].elm;
    if (currentParagraph === null) {
      return;
    }

    console.log(currentParagraph);
    currentParagraph.style.padding = '10px';
    currentParagraph.style.borderRadius = '5px';
    currentParagraph.style.backgroundColor = 'lightyellow';
    currentParagraph.style.color = 'black';
    currentParagraph.style.border = '1px solid yellow';
    currentParagraph.style.transition = 'all 0.3s ease-in-out';

    // also add a small shadow to the paragraph
    currentParagraph.style.boxShadow = '0 0 10px 5px rgba(0, 0, 0, 0.1)';

    currentParagraph.status = Status.ACTIVE;

    // Ensure paragraph is in view with 300px margin
    currentParagraph.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });

    const rect = currentParagraph.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 300) {
      window.scrollBy(0, rect.bottom - window.innerHeight + 300);
    }
    //TODO: highlight the collection of words
  }
}
