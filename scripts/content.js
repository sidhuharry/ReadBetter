// TODO: Improve the way you are predicting where the useful content is

// ---- Variables and Constants Start ----
const groupedWordsLength = 3;

//FIXM: This is not needed, I think. Revisit it,
const Status = {
  UNREAD: 'unread',
  READ: 'read',
  ACTIVE: 'active',
};
let currentElmIdx = 0;
let currentParagraph = null;
let readableElms = [];

let currentSentenceIdx = 0;
let currentSentence = null;
let sentenceList = [];

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
        return spans.some((span) => {
          let rbGeneratedAttr = span.getAttribute('read-better-generated');
          if (rbGeneratedAttr) {
            return false;
          }
          return span.innerText && span.innerText !== '';
        });
      }
    }
    return el.innerText && el.innerText !== '';
  };
  return elms.filter(isInViewport).filter(isReadable);
};

function getObjectSizeInMbs(obj) {
  const str = JSON.stringify(obj);
  const sizeInBytes = new Blob([str]).size;
  return sizeInBytes / (1024 * 1024);
}

function updateReadableElms() {
  let tempReadableElms = filterUnreadableElms([
    //TODO: On chatgpt.com, they are using p tag inside form to for the input field. This causes an infinite loop in mutation observer. p:not(form p) is to fix that. Find a better way to fix this.
    ...document.querySelectorAll(
      'div:last-child:not(:has(*)),p:not(form p),li:not(p li),li:not(:has(p)),tr,pre:not(:has(div, p, li, tr)),code:not(:has(div, p, li, tr)'
    ),
  ])
    .filter((elm) => {
      // Check status attribute. If it's already set then the element is already in the readableElms array
      let processed = elm.getAttribute('read-better-processed');
      if (!processed) {
        elm.setAttribute('read-better-processed', true);
        return true;
      }
      // This element is already in the readableElms array
      return false;
    })
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
  const sizeInMbs = getObjectSizeInMbs(readableElms);
  console.log(`Size of readableElms in memory: ${sizeInMbs} MB`);
  // merge readableElms and tempReadableElms
  readableElms = [...readableElms, ...tempReadableElms];
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

function updateSentenceList() {
  try {
    if (currentParagraph === null) {
      return;
    }
    const regex = />([^<]+)</g;
    console.log('Current paragraph', currentParagraph);

    console.log(
      'Current paragraph before wrapping',
      JSON.stringify(currentParagraph.innerHTML)
    );
    let newInnerHTML = currentParagraph.innerHTML.replace(
      regex,
      (match, text) => {
        let splitText = text
          .split(/([;:,\.\?\-])/)
          .filter((_splittedTxt) => _splittedTxt.trim() !== '');
        console.log('Split text', splitText);
        let wrappedText = splitText
          .map((_text) => `<span read-better-generated="true">${_text}</span>`) // Fixed closing tag
          .join(' ');
        console.log('Wrapped text', wrappedText);
        return `>${wrappedText}<`;
      }
    );
    currentParagraph.innerHTML = newInnerHTML;
    console.log('Current paragraph after wrapping', currentParagraph.innerHTML);
    sentenceList = [
      ...currentParagraph.querySelectorAll('span[read-better-generated]'),
    ];
    console.log('This is the sentence list', sentenceList);
  } catch (e) {
    console.error('Error in updateSentenceList', e);
  }
}

// Highlights words based on natural language reading style
//TODO: Improve this highlighting function with a word processing algo which groups text inside tags like <> {} () "" '' etc.
function highlightSentence() {
  //FIXME: Save the original css of the elements and restore when the sentence is unhighlighted
  if (currentParagraph === null || sentenceList.length === 0) {
    return;
  }
  // while adding spans to existing paragraph, maintain the original style of the paragraph
  currentParagraph.innerHTML = '';
  let aSentence = sentenceList[currentSentenceIdx];
  aSentence.style.backgroundColor = 'red';
}

// Function to highlight the selected paragraph
function highlightParagraph() {
  if (readableElms[currentElmIdx]) {
    currentParagraph = readableElms[currentElmIdx].elm;
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
  }
}

function resetSentenceHighlightOnParagraphMovement() {
  updateSentenceList();
  currentSentenceIdx = 0;
  highlightSentence();
}

function moveToNextSentence() {
  if (currentSentenceIdx < sentenceList.length - 1) {
    currentSentenceIdx++;
    highlightSentence();
  } else {
    // Move to the next paragraph
    highlightNextParagraph();
  }
}

function moveToPreviousSentence() {
  if (currentSentenceIdx > 0) {
    currentSentenceIdx--;
    highlightSentence();
  } else {
    // Move to the previous paragraph
    highlightPreviousParagraph();
  }
}

function highlightNextParagraph() {
  markParagraphRead(currentElmIdx);
  if (currentElmIdx < readableElms.length - 1) {
    currentElmIdx++;
  } else {
    // reset to zero and go back to the top of the page
    currentElmIdx = 0;
  }
  highlightParagraph();
  resetSentenceHighlightOnParagraphMovement();
}

function highlightPreviousParagraph() {
  if (currentElmIdx > 0) {
    markParagraphUnread(currentElmIdx);
    currentElmIdx--;
    resetSentenceHighlightOnParagraphMovement();
  }
  //TODO handle else case. show some animation to the user that they have reached the top of the page
}

function initParagraphHighlight() {
  updateReadableElms();
  currentElmIdx = 0;
  highlightParagraph();
  resetSentenceHighlightOnParagraphMovement();
}

function init() {
  // Initial paragraph and line highlight
  initParagraphHighlight();

  // Create a MutationObserver to watch for changes in the DOM for dynamically rendered elements
  //TODO Improve this observer. This is causing slowness on some websites
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        ((mutation.type === 'childList' || mutation.type === 'subtree') &&
          mutation.addedNodes.length > 0) ||
        mutation.removedNodes.length > 0
      ) {
        //FIXME: Instead of updating the whole array, update only the newly added nodes
        updateReadableElms();
        console.log('Readable elements updated', readableElms.length);
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

  // Handle keydown for navigating paragraphs and lines
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && event.shiftKey) {
      // Move to the next paragraph
      highlightNextParagraph();
    }
    if (event.key === 'ArrowUp' && event.shiftKey) {
      // Move to the previous paragraph\
      highlightPreviousParagraph();
    }

    // on right arrow key press move to the next sentence
    if (event.key === 'ArrowRight') {
      moveToNextSentence();
    }

    // on left arrow key press move to the previous sentence
    if (event.key === 'ArrowLeft') {
      moveToPreviousSentence();
    }
  });
}

// Since I am using the default document state, this is the first method to be called on 'document_idle'
init();
