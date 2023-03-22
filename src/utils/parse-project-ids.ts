const parseProjectIds = (id: string): string[] => {
  // @TODO: This needs better error handling.
  return id.split(',')
}

export default parseProjectIds
