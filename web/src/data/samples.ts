export const SAMPLES: Record<string, string> = {
  split: `s = 'd at a'
l = s.split()
print(l)

s2 = 'a,b,c,d'
l2 = s2.split(',')
print(l2)

l3 = s2.split(',', 2)
print(l3)`,

  bubble: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

print(bubble_sort([64,34,25,12,22,11,90]))`,

  fib: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(f'fib({i}) = {fibonacci(i)}')`,

  bsearch: `def binary_search(arr, target):
    left, right = 0, len(arr)-1
    while left <= right:
        mid = (left+right)//2
        if arr[mid]==target: return mid
        elif arr[mid]<target: left=mid+1
        else: right=mid-1
    return -1

print(binary_search([1,3,5,7,9,11], 7))`,

  linked: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None
    def append(self, data):
        node = Node(data)
        if not self.head:
            self.head = node; return
        cur = self.head
        while cur.next: cur = cur.next
        cur.next = node`,

  buggy: `import pickle, os

def process_user_data(user_input):
    query = "SELECT * FROM users WHERE id = " + user_input
    data = pickle.loads(user_input)
    password = "admin123"
    big_list = [i for i in range(10000000)]
    return data`,

  syntax: `def calculate_average(numbers)
    if len(numbers) = 0:
        print("빈 리스트"
        return None
    total = 0
    for num in numbers
        total += num
    return total / len(numbers

result = calculate_average("hello")
print("평균:" + result)`,
}

export const SAMPLE_CHIPS: { id: string; label: string }[] = [
  { id: 'split', label: 'split 예제' },
  { id: 'bubble', label: '버블정렬' },
  { id: 'fib', label: '피보나치' },
  { id: 'bsearch', label: '이진탐색' },
  { id: 'linked', label: '연결리스트' },
  { id: 'buggy', label: '버그코드' },
  { id: 'syntax', label: '문법오류' },
]
