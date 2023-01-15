
export interface Site {
  name: string,
  alias: string,
  url: string,
  additionalScript: string,
}

const removeTarget = 'console.log("remove target");let link = document.getElementsByTagName("a"); [].forEach.call(link, (elem) => {elem.removeAttribute("target")});console.log("removed target");';
const setTagName = 'Element.prototype.setTagName=function(strTN) {var oHTML=this.outerHTML, tempTag=document.createElement(strTN); var tName={original: this.tagName.toUpperCase(), change: strTN.toUpperCase()}; if (tName.original == tName.change) return; oHTML=oHTML.replace(RegExp("(^\\<" + tName.original + ")|(" + tName.original + "\\>$)","gi"), function(x){return (x.toUpperCase().replace(tName.original, tName.change));}); tempTag.innerHTML=oHTML; this.parentElement.replaceChild(tempTag.firstChild,this);};';
const getSockets = `window.sockets = [];
window.nativeWebSocket = window.WebSocket;
window.WebSocket = function(...args){
    const socket = new window.nativeWebSocket(...args);
    window.sockets.push(socket);
    return socket;
};`;

const testSupportFix = `function testSupport() {
    if (window.WebSocket && window.flagggg) {
        if (initSocket()) {} else {
            console.log("Can not connect to server" + wsUri)
        }
    } else {
        $("#nowebsocket").show()
    }
};`;

const sites: Site[] = [

  {
    name: 'Jump 4 Love',
    alias: 'j4l',
    url: 'https://my.j4l.com/account.love',
    additionalScript: `setTimeout(() => {${removeTarget}}, 3000)`,
  },

  {
    name: 'Romance',
    alias: 'RC',
    url: 'https://login.romancecompass.com/login/',
    additionalScript:
            `setTimeout(() => {${removeTarget}${setTagName} }, 4000)`,

  },

  {
    name: 'Charmdate',
    alias: 'charm',
    url: 'https://www.charmdate.com/lady/set.php',
    additionalScript: `${testSupportFix + getSockets};setTimeout(() => {${removeTarget}}, 3000);`,

  },

  {
    name: 'Natashaclub',
    alias: 'NC',
    url: 'https://www.natashaclub.com/member.php',
    additionalScript:
            `setTimeout(() => {${removeTarget}}, 3000)`,
  },

  {
    name: 'Ladadate',
    alias: 'Ladadate',
    url: 'https://ladadate.com/signin',
    additionalScript:
            `setTimeout(() => {${removeTarget}}, 3000)`,
  },
  {
    name: 'Svadba',
    alias: 'Svadba',
    url: 'https://www.svadba.com/',
    additionalScript:
            `setTimeout(() => {${removeTarget}}, 3000)`,
  },
  {
    name: 'Goldenbride',
    alias: 'Golden',
    url: 'https://goldenbride.net/',
    additionalScript:
            `setTimeout(() => {${removeTarget}}, 3000)`,
  },
  {
    name: 'Generationlove',
    alias: 'Generationlove',
    url: 'https://www.generationlove.com/login/',
    additionalScript:
            `setTimeout(() => {${removeTarget}}, 3000)`,
  },
  {
    name: 'Dream',
    alias: 'Dream',
    url: 'https://www.dream-singles.com/login',
    additionalScript:
            `setTimeout(() => {${removeTarget}}, 3000); const originalSend = WebSocket.prototype.send;
window.sockets = [];
WebSocket.prototype.send = function(...args) {
  if (window.sockets.indexOf(this) === -1)
    window.sockets.push(this);
  return originalSend.call(this, ...args);
};`,
  },
  {
    name: 'Findbride',
    alias: 'Findbride',
    url: 'https://findbride.com/girl/',
    additionalScript:
            `setTimeout(() => {${removeTarget}}, 3000)`,
  },
];

export default sites
