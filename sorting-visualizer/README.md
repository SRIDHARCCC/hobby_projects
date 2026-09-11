# 📊 SortLab: Bubble Sort & Selection Sort Visualizer

An interactive educational web application designed to help you visually grasp and compare **Bubble Sort** and **Selection Sort**.

---

## 🚀 How to Run

- 💻 **Locally:** Simply open **[`index.html`](./index.html)** in any browser. No installation, server, or build step required!
- ☁️ **Cloud Deployment:** Includes a production-ready `Dockerfile` and `nginx.conf` ready for deployment on any container service (e.g. Cloud Run, AWS ECS, Render, etc.).

*(Optional local server: run `python -m http.server 3000` or `npx serve` inside this directory and visit `http://localhost:3000`).*

---

## 🎯 Key Features

- **Single View & Side-by-Side Comparison Modes**:
  - In **Single View**, focus entirely on either **Bubble Sort** or **Selection Sort** with code walkthroughs.
  - In **Side-by-Side Mode**, both algorithms run synchronously on the exact same randomized input array, allowing you to visually see the difference in comparisons vs. swaps in real time!
- **Interactive Controls**:
  - **Start / Pause**: Run animations automatically at adjustable speeds.
  - **Step Forward (⏭)**: Execute one comparison or swap at a time to examine the logic at your own pace.
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
| 🔴 **Rose / Red** | Swapping | Elements are out of order and currently swapping positions. |
| 🟢 **Green** | Sorted | Permanently placed in its final sorted position. |

---

## 🧠 Algorithmic Concepts Summary

| Characteristic | Bubble Sort | Selection Sort |
|---|---|---|
| **Core Idea** | Repeatedly swaps adjacent elements if they are out of order until the largest elements "bubble" to the end. | Repeatedly searches the unsorted subarray to find the absolute minimum, then places it at the front. |
| **Comparisons** | $O(n^2)$ | Always $O(n^2)$ |
| **Swaps (Writes)** | High: Up to $O(n^2)$ swaps | Minimal: At most $O(n)$ swaps (1 per pass) |
| **Best Case** | $O(n)$ (when already sorted, thanks to early exit flag) | $O(n^2)$ |
| **Stability** | **Stable** (preserves original order of duplicates) | **Unstable** (long swaps may alter relative order) |
