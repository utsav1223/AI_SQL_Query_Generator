class MinHeap {
  constructor(scoreFn) {
    this.items = [];
    this.scoreFn = scoreFn;
  }

  get size() {
    return this.items.length;
  }

  peek() {
    return this.items[0];
  }

  push(item) {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  replaceRoot(item) {
    this.items[0] = item;
    this.bubbleDown(0);
  }

  bubbleUp(index) {
    let currentIndex = index;

    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);

      if (this.scoreFn(this.items[parentIndex]) <= this.scoreFn(this.items[currentIndex])) {
        break;
      }

      [this.items[parentIndex], this.items[currentIndex]] = [this.items[currentIndex], this.items[parentIndex]];
      currentIndex = parentIndex;
    }
  }

  bubbleDown(index) {
    let currentIndex = index;

    while (true) {
      const leftIndex = currentIndex * 2 + 1;
      const rightIndex = currentIndex * 2 + 2;
      let smallestIndex = currentIndex;

      if (
        leftIndex < this.items.length &&
        this.scoreFn(this.items[leftIndex]) < this.scoreFn(this.items[smallestIndex])
      ) {
        smallestIndex = leftIndex;
      }

      if (
        rightIndex < this.items.length &&
        this.scoreFn(this.items[rightIndex]) < this.scoreFn(this.items[smallestIndex])
      ) {
        smallestIndex = rightIndex;
      }

      if (smallestIndex === currentIndex) {
        break;
      }

      [this.items[currentIndex], this.items[smallestIndex]] = [this.items[smallestIndex], this.items[currentIndex]];
      currentIndex = smallestIndex;
    }
  }

  toSortedArray() {
    return [...this.items].sort((a, b) => this.scoreFn(b) - this.scoreFn(a));
  }
}

const getTopK = (items, k, scoreFn) => {
  const safeK = Math.max(Number(k) || 0, 0);

  if (!safeK) {
    return [];
  }

  const heap = new MinHeap(scoreFn);

  items.forEach((item) => {
    if (heap.size < safeK) {
      heap.push(item);
      return;
    }

    if (scoreFn(item) > scoreFn(heap.peek())) {
      heap.replaceRoot(item);
    }
  });

  return heap.toSortedArray();
};

module.exports = {
  MinHeap,
  getTopK
};
