// TODO: handle a website which is using <br> to create newlines rather than paragraphs or divs
// TODO: Improve the way you are predicting where the useful content is
//FIXME: Going back up on the page, removing highlight from the paragraph is not working
// ---- Variables and Constants Start ----
const groupedWordsLength = 3;
const Status = {
  UNREAD: 'unread',
  READ: 'read',
  ACTIVE: 'active',
};
let currentElmIdx = 0;
let currentParagraph = null;
let readableElms = [];

// ---- Variables and Constants End -----

const filterUnreadableElms = (elms) => {
  const isInViewport = (el) => {
    const rect = el.getBoundingClientRect();
    const windowWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const horInView =
      rect.left <= windowWidth * 0.6 && rect.right >= windowWidth * 0.4;
    return horInView;
  };
  const isReadable = (el) => {
    if (el.tagName === 'DIV') {
      let spans = [...el.querySelectorAll('span')];
      if (spans.length > 0) {
        return spans.some((span) => span.innerText && span.innerText !== '');
      }
    }
    return el.innerText && el.innerText !== '';
  };
  return elms.filter(isInViewport).filter(isReadable);
};

function getObjectSizeInMegabytes(obj) {
  const str = JSON.stringify(obj);
  const sizeInBytes = new Blob([str]).size;
  return sizeInBytes / (1024 * 1024);
}

function updateReadableElms() {
  readableElms = filterUnreadableElms([
    ...document.querySelectorAll('div:last-child:not(:has(div)'),
    ...document.querySelectorAll('p'),
    ...document.querySelectorAll('li:not(p li)'), // select only li which are without the p tag
    ...document.querySelectorAll('tr'),
    ...document.querySelectorAll('pre:not(:has(div, p, li, tr))'),
    ...document.querySelectorAll('code:not(:has(div, p, li, tr))'),
  ])
    .map((elm) => {
      let bgColor = elm.getAttribute('read-better-original-bg');
      if (!bgColor) {
        elm.setAttribute('read-better-original-bg', elm.style.backgroundColor);
        bgColor = elm.style.backgroundColor;
      }
      let color = elm.getAttribute('read-better-original-color');
      if (!color) {
        elm.setAttribute('read-better-original-color', elm.style.color);
        color = elm.style.color;
      }
      return {
        elm: elm,
        status: Status.UNREAD,
        bgColor: bgColor,
        color: color,
      };
    })
    .sort((a, b) => {
      const rectA = a.elm.getBoundingClientRect();
      const rectB = b.elm.getBoundingClientRect();
      return rectA.top - rectB.top;
    });
  const sizeInMbs = getObjectSizeInMegabytes(readableElms);
  console.log(`Size of readableElms in memory: ${sizeInMbs} MB`);
}

function markParagraphRead(index) {
  if (readableElms[index]) {
    readableElms[index].status = Status.READ;
  }
}

function markParagraphUnread(index) {
  if (readableElms[index]) {
    readableElms[index].status = Status.UNREAD;
    readableElms[index].elm.style.backgroundColor = readableElms[index].bgColor;
    readableElms[index].elm.style.color = readableElms[index].color;

    // Ensure paragraph is in view with 300px margin
    readableElms[index].elm.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });

    const rect = readableElms[index].elm.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 300) {
      window.scrollBy(0, rect.bottom - window.innerHeight + 300);
    }
  }
}

// Function to highlight the selected paragraph
function highlightParagraph(index) {
  if (readableElms[index]) {
    currentParagraph = readableElms[index].elm;
    if (currentParagraph === null) {
      return;
    }

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

function init() {
  // Create a MutationObserver to watch for changes in the DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      console.log('This is the mutation', mutation);
      if (
        ((mutation.type === 'childList' || mutation.type === 'subtree') &&
          mutation.addedNodes.length > 0) ||
        mutation.removedNodes.length > 0 ||
        filterUnreadableElms([...mutation.addedNodes]).length > 0
      ) {
        updateReadableElms();
        console.log('Readable elements updated', readableElms);
      }
    });
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    // Do not observe attribute changes
    attributes: false,
  });

  // Initial paragraph and line highlight
  highlightParagraph(currentElmIdx);

  // Handle keydown for navigating paragraphs and lines
  document.addEventListener('keydown', (event) => {
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
      }
    }
  });
}

init();
