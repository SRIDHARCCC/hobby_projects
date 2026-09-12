# 📊 SortLab: Bubble, Selection & Merge Sort Visualizer

An interactive educational web application designed to help you visually grasp and compare **Bubble Sort**, **Selection Sort**, and **Merge Sort**.

---

## 🚀 How to Run

- 💻 **Locally:** Simply open **[`index.html`](./index.html)** in any browser. No installation, server, or build step required!
- ☁️ **Cloud Deployment:** Includes a production-ready `Dockerfile` and `nginx.conf` ready for deployment on any container service (e.g. Cloud Run, AWS ECS, Render, etc.).

*(Optional local server: run `python -m http.server 3000` or `npx serve` inside this directory and visit `http://localhost:3000`).*

---

## 🎯 Key Features

- **Single View & Side-by-Side Comparison Modes**:
  - In **Single View**, focus entirely on **Bubble Sort**, **Selection Sort**, or **Merge Sort** with code walkthroughs.
  - In **Side-by-Side Mode**, all three algorithms run synchronously on the exact same randomized input array, allowing you to visually see how $O(n \log n)$ Merge Sort dramatically outpaces $O(n^2)$ Bubble and Selection Sort in real time!
- **Interactive Controls**:
  - **Start / Pause**: Run animations automatically at adjustable speeds.
  - **Step Forward (⏭)**: Execute one comparison or swap/write at a time to examine the logic at your own pace.
  - **Array Size Slider**: Test with smaller arrays (5–15 elements) for readable values or larger arrays (up to 35 elements) for macro patterns.
  - **Speed Slider**: From Slowest (step-by-step clarity) to Lightning.
  - **Presets**:
    - *Random Numbers*
    - *Reversed (Worst Case)*
    - *Nearly Sorted (Best Case for Bubble Sort)*
    - *Few Unique (Testing duplicate values)*
- **Live Metrics**:
  - Real-time comparison count
  - Real-time swap/write count
  - Live narration box explaining what is happening at the current step

---

## 🎨 Visual Color Legend

| Color | State | Meaning |
|---|---|---|
| 🔵 **Blue** | Default / Unsorted | Element is waiting to be processed. |
| 🟡 **Yellow** | Comparing | The algorithm is currently inspecting these two elements. |
| 🟣 **Purple** | Current Minimum | *Selection Sort only*: marks the lowest value found so far in the unsorted scan. |
| 🔴 **Rose / Red** | Swapping / Writing | Elements are out of order and swapping positions, or being written back into position during merge. |
| 🟢 **Green** | Sorted | Permanently placed in its final sorted position. |

---

## 🧠 Algorithmic Concepts Summary

| Characteristic | Bubble Sort 🧼 | Selection Sort 🎯 | Merge Sort ⚡ |
|---|---|---|---|
| **Core Idea** | Repeatedly swaps adjacent elements if they are out of order until the largest elements "bubble" to the end. | Repeatedly searches the unsorted subarray to find the absolute minimum, then places it at the front. | **Divide & Conquer**: Recursively halves the array, sorts the halves, and merges them back in order. |
| **Comparisons** | $O(n^2)$ | Always $O(n^2)$ | Guaranteed $O(n \log n)$ |
| **Swaps (Writes)** | High: Up to $O(n^2)$ swaps | Minimal: At most $O(n)$ swaps (1 per pass) | $O(n \log n)$ writes into merged array |
| **Best Case Time** | $O(n)$ (when already sorted) | $O(n^2)$ | $O(n \log n)$ |
| **Space Complexity** | $O(1)$ (In-place) | $O(1)$ (In-place) | $O(n)$ (Auxiliary memory during merge) |
| **Stability** | **Stable** | **Unstable** | **Stable** |
