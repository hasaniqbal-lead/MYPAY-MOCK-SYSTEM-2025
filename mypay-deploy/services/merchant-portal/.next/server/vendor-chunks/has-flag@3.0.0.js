"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/has-flag@3.0.0";
exports.ids = ["vendor-chunks/has-flag@3.0.0"];
exports.modules = {

/***/ "(ssr)/../../node_modules/.pnpm/has-flag@3.0.0/node_modules/has-flag/index.js":
/*!******************************************************************************!*\
  !*** ../../node_modules/.pnpm/has-flag@3.0.0/node_modules/has-flag/index.js ***!
  \******************************************************************************/
/***/ ((module) => {

eval("\nmodule.exports = (flag, argv)=>{\n    argv = argv || process.argv;\n    const prefix = flag.startsWith(\"-\") ? \"\" : flag.length === 1 ? \"-\" : \"--\";\n    const pos = argv.indexOf(prefix + flag);\n    const terminatorPos = argv.indexOf(\"--\");\n    return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2hhcy1mbGFnQDMuMC4wL25vZGVfbW9kdWxlcy9oYXMtZmxhZy9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUNBQSxPQUFPQyxPQUFPLEdBQUcsQ0FBQ0MsTUFBTUM7SUFDdkJBLE9BQU9BLFFBQVFDLFFBQVFELElBQUk7SUFDM0IsTUFBTUUsU0FBU0gsS0FBS0ksVUFBVSxDQUFDLE9BQU8sS0FBTUosS0FBS0ssTUFBTSxLQUFLLElBQUksTUFBTTtJQUN0RSxNQUFNQyxNQUFNTCxLQUFLTSxPQUFPLENBQUNKLFNBQVNIO0lBQ2xDLE1BQU1RLGdCQUFnQlAsS0FBS00sT0FBTyxDQUFDO0lBQ25DLE9BQU9ELFFBQVEsQ0FBQyxLQUFNRSxDQUFBQSxrQkFBa0IsQ0FBQyxJQUFJLE9BQU9GLE1BQU1FLGFBQVk7QUFDdkUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AbXlwYXkvbWVyY2hhbnQtcG9ydGFsLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9oYXMtZmxhZ0AzLjAuMC9ub2RlX21vZHVsZXMvaGFzLWZsYWcvaW5kZXguanM/NmJhYiJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IChmbGFnLCBhcmd2KSA9PiB7XG5cdGFyZ3YgPSBhcmd2IHx8IHByb2Nlc3MuYXJndjtcblx0Y29uc3QgcHJlZml4ID0gZmxhZy5zdGFydHNXaXRoKCctJykgPyAnJyA6IChmbGFnLmxlbmd0aCA9PT0gMSA/ICctJyA6ICctLScpO1xuXHRjb25zdCBwb3MgPSBhcmd2LmluZGV4T2YocHJlZml4ICsgZmxhZyk7XG5cdGNvbnN0IHRlcm1pbmF0b3JQb3MgPSBhcmd2LmluZGV4T2YoJy0tJyk7XG5cdHJldHVybiBwb3MgIT09IC0xICYmICh0ZXJtaW5hdG9yUG9zID09PSAtMSA/IHRydWUgOiBwb3MgPCB0ZXJtaW5hdG9yUG9zKTtcbn07XG4iXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImZsYWciLCJhcmd2IiwicHJvY2VzcyIsInByZWZpeCIsInN0YXJ0c1dpdGgiLCJsZW5ndGgiLCJwb3MiLCJpbmRleE9mIiwidGVybWluYXRvclBvcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/.pnpm/has-flag@3.0.0/node_modules/has-flag/index.js\n");

/***/ })

};
;