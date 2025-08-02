const simpleClone = <Data>(data: Data): Data => {
  if (typeof data === 'undefined') return data
  if (typeof data === 'number') return data
  return JSON.parse(JSON.stringify(data))
}

export default simpleClone
