// read contents of the file

// split the contents by new line

// write the contents to the file
export function init(data) {
  const lines = data
    .split(/\r?\n/)
    .filter((line) => !line.trim()?.startsWith("self.__logger"));

  const chunks = getChunks(lines);
  const flowMap = getFlowMap(chunks);

  const stepFlowList = () => {
    const flowNameList = Array.from(flowMap.keys());
    const flowName = flowNameList.find(e => e.startsWith("流程: Main"))
    const flowValue = flowMap.get(flowName)
    
    flowMap.delete(flowName)
    return flowMap.set(flowName, flowValue)
  }

  const o = {};
  Array.from(stepFlowList().keys()).forEach((flow) => {
    o[flow] = generate(flowMap, flow);
  });

  return o;
}

function generate(FlowMap, funcName) {
  const flowStep = stepNode(FlowMap, funcName);

  const flowTree = treeNode(flowStep);

  const obj = {};
  flowTree.forEach((item) => {
    if (item.节点功能.startsWith("赋值初始化")) {
      if (!Array.isArray(obj[item.节点功能])) {
        obj["初始化"] = [];
        obj["初始化"].push(item);
      } else {
        obj["初始化"].push(item);
      }
    } else {
      if (!Array.isArray(obj[item.节点功能])) {
        obj[item.节点功能] = [];
        obj[item.节点功能].push(item);
      } else {
        obj[item.节点功能].push(item);
      }
    }
  });
  return obj;
}

function getChunks(lines) {
  const chunks = {};
  var funcName = ''
  lines.slice(48)?.forEach((line, index) => {
    const level = line.length - line.trimStart().length;
    // console.log(`${index + 1} :${level} :${line}`);

    funcName =
      line.trim().startsWith("def") && level === 4
        ? `流程: ${line.split("def ")[1].split("(")[0]}, level: ${level}`
        : funcName;

    if (!funcName) {
      return;
    }

    if (funcName && chunks[funcName] === undefined) {
      chunks[funcName] = new Map();
      return;
    }

    if (chunks[funcName] !== undefined) {
      chunks[funcName].set({ lineNumber: index + 48, level }, line.trim());
    }
  });
  return chunks;
}

function getFlowMap(chunks) {
  const flowMap = new Map();
  for (const key in chunks) {
    if (Object.hasOwnProperty.call(chunks, key)) {
      let arr = [];
      for (const [keys, values] of chunks[key].entries()) {
        if (values === "") {
          break;
        }
        arr.push({ value: JSON.stringify(keys), line: values });
      }
      flowMap.set(key, arr);
    }
  }
  return flowMap;
}

function stepNode(flowList, funcName) {
  let flowStep = {};
  flowList.get(funcName)?.forEach((item) => {
    const { value, line } = item;
    const { lineNumber, level } = JSON.parse(value);

    // if (line.startsWith("#")) {
    if (
      line.startsWith("#") ||
      line.startsWith("elif") ||
      line.startsWith("else") ||
      line.startsWith("except") ||
      line.startsWith("finally") ||
      line.startsWith("self") ||
      line.startsWith("if") ||
      line.startsWith("try")
    ) {
      flowStep[`${line}${lineNumber}`] = {};
    }

    if (
      Object.keys(flowStep).filter((e) => !e.startsWith("赋值")).length === 0 &&
      !line.startsWith("#")
    ) {
      flowStep[`赋值初始化流程${lineNumber}`] = {};
    }

    const stepNameList = Object.keys(flowStep);
    const stepName = stepNameList[stepNameList.length - 1];

    // todo: 解析节点信息
    const info = flowStep[stepName]?.["节点信息"]
      ? `${flowStep[stepName]?.["节点信息"]}; ${line}`
      : line;

    flowStep[stepName] = {
      节点功能: stepName,
      行号: lineNumber,
      节点层级: level,
      节点信息: info,
    };
  });
  return flowStep;
}

function treeNode(flowStep) {
  // 生成pid
  const pidMap = new Map();

  for (const key in flowStep) {
    if (Object.hasOwnProperty.call(flowStep, key)) {
      const element = flowStep[key];
      element["id"] = element["行号"];
      if (pidMap.has(element["节点层级"]) - 4) {
        element["pid"] = pidMap.get(element["节点层级"] - 4) || 0;
      }
      pidMap.set(element["节点层级"], element["行号"]);
    }
  }

  return arrayToTree(Object.values(flowStep));
}

function arrayToTree(items) {
  const result = []; // 存放结果集
  const itemMap = {}; //
  for (const item of items) {
    const id = item.id;
    const pid = item.pid;

    if (!itemMap[id]) {
      itemMap[id] = {
        children: [],
      };
    }

    itemMap[id] = {
      ...item,
      children: itemMap[id]["children"],
    };

    const treeItem = itemMap[id];

    if (pid === 0) {
      result.push(treeItem);
    } else {
      if (!itemMap[pid]) {
        itemMap[pid] = {
          children: [],
        };
      }
      itemMap[pid].children.push(treeItem);
    }
  }
  return result;
}

function getStepName(line) {
  const stepNameMatch = line.match(/^\s*def\s+(\w+)\s*\(/);
  if (stepNameMatch) {
    stepName = stepNameMatch[1];
  }
}

// }

// console.log(flowList)
