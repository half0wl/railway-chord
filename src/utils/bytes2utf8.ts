const bytes2utf8 = (b: ArrayBuffer): string => {
  return Buffer.from(b).toString('utf-8')
}

export default bytes2utf8
