/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Use IIFE to prevent contaminating the window object
(function () {
  const outputXML = createXML("JS_environment");
  let objs = new Map();
  let constructors = new Map();
  // wait until the document loads before scanning
  window.addEventListener("load", function () {
    alert('2022-02-07 19:06');
    const thisObjectNode = outputXML.createElement("object");
    thisObjectNode.setAttribute("name", "window");
    outputXML.documentElement.appendChild(thisObjectNode);
    addDescription("window", window, thisObjectNode);
    testConstructors();
    const serializer = new XMLSerializer();
    const xmlStr = serializer.serializeToString(outputXML);
    const file = new Blob( [ xmlStr ] );
    const filename = prompt("Enter a filename:");
    saveFile(file, filename);
  });
  function saveFile(blob, name) {
    const a = document.createElement("a");
    a.download = name;
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function createXML(rootElement) {
    const xmlStr = '<' + rootElement + '></' + rootElement + '>';
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, "application/xml");
    // print the name of the root element or error message
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
      throw new Error("XMLDocument: Error while creating");
    }
    return doc;
  }
  function testConstructors() {
    for (let entry of constructors) {
      let thisConstructorPath = entry[0];
      let thisConstructor = entry[1];
      let thisNode = outputXML.createElement("constructor");
      thisNode.setAttribute("path", thisConstructorPath);
      thisNode.setAttribute("length", thisConstructor.length);
      const descriptor = Object.getOwnPropertyDescriptors(thisConstructor);
      delete descriptor.length;
      delete descriptor.prototype;
      for (let propertyName in descriptor) {
        let strPropertyName = (typeof propertyName === "symbol") ? "@@" + propertyName.description : propertyName;
        let propertyDescriptor = descriptor[propertyName];
        let nodeProperty = outputXML.createElement("static");
        nodeProperty.setAttribute("name", strPropertyName);
        nodeProperty.setAttribute("enumerable", propertyDescriptor.enumerable ? "yes" : "no");
        nodeProperty.setAttribute("configurable", propertyDescriptor.configurable ? "yes" : "no");
        if (propertyDescriptor.hasOwnProperty("writable")) {
          nodeProperty.setAttribute("type", "data");
          nodeProperty.setAttribute("writable", propertyDescriptor.writable ? "yes" : "no");
//          addDescription(thisConstructorPath + "." + strPropertyName, thisConstructor[propertyName], nodeProperty);
        } else {
          nodeProperty.setAttribute("type", "accessor");
          nodeProperty.setAttribute("getter", (propertyDescriptor.hasOwnProperty("get")) ? "yes" : "no");
          nodeProperty.setAttribute("setter", (propertyDescriptor.hasOwnProperty("set")) ? "yes" : "no");
          try {
//            addDescription(thisConstructorPath + "." + strPropertyName, thisConstructor[propertyName], nodeProperty);
          } catch (e) {
            nodeProperty.setAttribute("typeof", "error");
            nodeProperty.appendChild(outputXML.createTextNode(e.toString()));
          }
        }
        thisNode.appendChild(nodeProperty);
      }
      try {
        new thisConstructor();
      } catch (e) {
        thisNode.appendChild(outputXML.createTextNode(e.toString()));
      }
      outputXML.documentElement.appendChild(thisNode);
    }
  }
  function addDescription(parentProperty, obj, parentNode) {
    function expandObject() {
      if (objs.has(obj)) {
        parentNode.appendChild(outputXML.createTextNode(objs.get(obj)));
      } else {
        objs.set(obj, parentProperty);
        const descriptor = Object.getOwnPropertyDescriptors(obj);
        for (let propertyName in descriptor) {
          let strPropertyName = (typeof propertyName === "symbol") ? "@@" + propertyName.description : propertyName;
          let propertyDescriptor = descriptor[propertyName];
          let nodeProperty = outputXML.createElement("property");
          nodeProperty.setAttribute("name", strPropertyName);
          nodeProperty.setAttribute("enumerable", propertyDescriptor.enumerable ? "yes" : "no");
          nodeProperty.setAttribute("configurable", propertyDescriptor.configurable ? "yes" : "no");
          if (propertyDescriptor.hasOwnProperty("writable")) {
            nodeProperty.setAttribute("type", "data");
            nodeProperty.setAttribute("writable", propertyDescriptor.writable ? "yes" : "no");
            addDescription(parentProperty + "." + strPropertyName, obj[propertyName], nodeProperty);
          } else {
            nodeProperty.setAttribute("type", "accessor");
            nodeProperty.setAttribute("getter", (propertyDescriptor.hasOwnProperty("get")) ? "yes" : "no");
            nodeProperty.setAttribute("setter", (propertyDescriptor.hasOwnProperty("set")) ? "yes" : "no");
            try {
              addDescription(parentProperty + "." + strPropertyName, obj[propertyName], nodeProperty);
            } catch (e) {
              nodeProperty.setAttribute("typeof", "error");
              nodeProperty.appendChild(outputXML.createTextNode(e.toString()));
            }
          }
          parentNode.appendChild(nodeProperty);
        }
        let nodePrototype = outputXML.createElement("prototype");
        const objPrototype = Object.getPrototypeOf(obj);
        addDescription(parentProperty + ".__proto__", objPrototype, nodePrototype);
        parentNode.appendChild(nodePrototype);
      }
    }
    switch (typeof obj) {
      case "undefined":
        parentNode.setAttribute("typeof", "undefined");
        return;
      case "boolean":
      case "number":
      case "bigint":
      case "string":
      case "symbol":
        parentNode.setAttribute("typeof", typeof obj);
        parentNode.appendChild(outputXML.createTextNode(obj.toString()));
        return;
      case "function":
        parentNode.setAttribute("typeof", "function");
        parentNode.setAttribute("length", obj.length);
        if (obj.hasOwnProperty("prototype")) {
          objs.set(obj, parentProperty);
          objs.set(obj.prototype, parentProperty + ".prototype");
          constructors.set(parentProperty, obj);
        } else {
          const descriptor = Object.getOwnPropertyDescriptors(obj);
          delete descriptor.length;
          delete descriptor.name;
          for (let propertyName in descriptor) {
            let strPropertyName = (typeof propertyName === "symbol") ? "@@" + propertyName.description : propertyName;
            let propertyDescriptor = descriptor[propertyName];
            let nodeProperty = outputXML.createElement("property");
            nodeProperty.setAttribute("name", strPropertyName);
            nodeProperty.setAttribute("enumerable", propertyDescriptor.enumerable ? "yes" : "no");
            nodeProperty.setAttribute("configurable", propertyDescriptor.configurable ? "yes" : "no");
            if (propertyDescriptor.hasOwnProperty("writable")) {
              nodeProperty.setAttribute("type", "data");
              nodeProperty.setAttribute("writable", propertyDescriptor.writable ? "yes" : "no");
              addDescription(parentProperty + "." + strPropertyName, obj[propertyName], nodeProperty);
            } else {
              nodeProperty.setAttribute("type", "accessor");
              nodeProperty.setAttribute("getter", (propertyDescriptor.hasOwnProperty("get")) ? "yes" : "no");
              nodeProperty.setAttribute("setter", (propertyDescriptor.hasOwnProperty("set")) ? "yes" : "no");
              try {
                addDescription(parentProperty + "." + strPropertyName, obj[propertyName], nodeProperty);
              } catch (e) {
                nodeProperty.setAttribute("typeof", "error");
                nodeProperty.appendChild(outputXML.createTextNode(e.toString()));
              }
            }
            parentNode.appendChild(nodeProperty);
          }
        }
        return;
      case "object":
        if (obj === null) {
          parentNode.setAttribute("typeof", "null");
          return;
        } else {
          parentNode.setAttribute("typeof", "object");
          expandObject();
          return;
        }
      default:
        parentNode.setAttribute("typeof", typeof obj);
        return;
    }
  }
})();
