from __future__ import annotations

import threading
import time
from queue import PriorityQueue, Empty
from typing import Callable, Optional


class JobQueueManager:
    def __init__(self) -> None:
        self._queue: PriorityQueue[tuple[int, float, int]] = PriorityQueue()
        self._processor: Optional[Callable[[int], None]] = None
        self._worker_thread: Optional[threading.Thread] = None
        self._running = False
        self._cancelled: set[int] = set()

    def configure(self, processor: Callable[[int], None]) -> None:
        self._processor = processor
        if not self._running:
            self._start_worker()

    def enqueue(self, job_id: int, priority: int) -> None:
        self._queue.put((priority, time.time(), job_id))

    def cancel(self, job_id: int) -> None:
        self._cancelled.add(job_id)

    def _start_worker(self) -> None:
        self._running = True
        self._worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self._worker_thread.start()

    def _worker_loop(self) -> None:
        while self._running:
            try:
                priority, _, job_id = self._queue.get(timeout=1)
            except Empty:
                continue
            if job_id in self._cancelled:
                self._cancelled.discard(job_id)
                continue
            if not self._processor:
                continue
            try:
                self._processor(job_id)
            finally:
                self._queue.task_done()


job_queue = JobQueueManager()
