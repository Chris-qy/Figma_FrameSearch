// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
// This shows the HTML page in "ui.html".

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
// width: 400, height: 100, 
let WindwoWidth = 500;
 figma.showUI(__html__, {width: WindwoWidth, height: 65, title: "Frame Search"});

let nodes = [];
let timer = null;

function* walkTree(root) {
  const pagecount = root.children.length;
  nodes.length = 0;
  for (let j = 0; j < pagecount; j++) {
    let currentPage = root.children[j];
    // const node = currentPage;
    // yield node;
    const childcount = currentPage.children.length;
    for (let i = 0; i < childcount; i++) {
      const node = currentPage.children[i];
      yield node;
    }
  }
}

function match(pattern, string) {
  switch(pattern.constructor.name) {
    case "String":
      return string.includes(pattern);
    case "RegExp":
      return string.match(pattern);
    default:
      return undefined;
  }
}

function searchFor(query) {
  let pattern = query.toLowerCase()
  if(pattern.indexOf(" ") != -1) {
    pattern = pattern.replaceAll(" ", ".*");
    pattern = new RegExp(pattern);
  }

let walker = walkTree(figma.root);

  function processOnce() {
    let count = 0;
    let done = true;
    let res
    while (!(res = walker.next()).done) {
      let node = res.value
      // if (node.type === 'FRAME' || node.type === 'PAGE') {
        if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'GROUP') {
        if(match(pattern, node.name.toLowerCase())) {
          nodes.push(node);
          console.log(node);
          figma.ui.postMessage({
            name: node.name,
            page: node.parent.name,
            index: nodes.length - 1
          });
          console.log(nodes.length);
          if (nodes.length<10){figma.ui.resize(WindwoWidth, 87 + nodes.length*33);}
          
        }

      }
      if (++count === 100) {
        done = false;
        timer = setTimeout(processOnce, 20);
        break;
      }
    }
    if (res.done){
      if (nodes.length===0){ figma.notify(`Frame ${query} not found, try another word`);}
    };
    //figma.ui.postMessage({ query, results, done })
  }

  processOnce();
}

figma.ui.onmessage = msg => {

    if (timer) {
      clearTimeout(timer);
    }
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'search_for_something') {
      console.log("search keyword is", msg.textbox);
      figma.ui.resize(WindwoWidth, 65);
      searchFor(msg.textbox);
   }
    
    if (msg.type === 'searchresults') {
      console.log(msg.index);
      let node = nodes[msg.index];

      if (node.type === "PAGE") {
        figma.currentPage = node;
    } else {
        // Figure out if the node is on the right page, 
        // otherwise, we need to switch to that page before zooming into the view
        let currentParent = node.parent;
        while (currentParent.type !== "PAGE") {
            currentParent = currentParent.parent;
        }
        figma.currentPage = currentParent;
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.currentPage.selection = [node];
    }
    //figma.closePlugin();
}
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.

  if (msg.type === 'cancel') 
    {figma.closePlugin();
    }

};