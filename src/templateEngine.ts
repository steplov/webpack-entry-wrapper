function isObj (obj: any) {
  return obj !== null && typeof (obj) === 'object'
}

function prop (obj: any, path: string) {
  if (!isObj(obj) || typeof path !== 'string') {
    return obj
  }
  const pathArr = path.split('.')
  for (let i = 0; i < pathArr.length; i++) {
    const p = pathArr[i]
    obj = Object.prototype.hasOwnProperty.call(obj, p) ? obj[p] : null
    if (obj === null) {
      break
    }
  }
  return obj
}

function resolveTemplate (string: string, data: Record<string, any>) {
  const regex = /{{2}(.+?)}{2}/g
  let result
  let formattedString = string

  while ((result = regex.exec(string)) !== null) {
    const item = result[1].trim()
    if (item) {
      const value = prop(data, item)
      if (value !== undefined && value !== null) {
        formattedString = formattedString.replace(result[0], value)
      } else {
        const error = new Error('Missing value for ' + result[0]);
        (error as any).key = item;
        (error as any).code = 'E_MISSING_KEY'
        throw error
      }
    }
  }
  return formattedString
}

export { resolveTemplate }