---
id: experiment-0001
type: experiment
title: MoE vs Dense Model Training Efficiency
status: active
tags:
  - MoE
  - Training Efficiency
  - LLM
hypothesis: Mixture of Experts (MoE) architectures can achieve comparable model quality to dense models with 30-40% less compute during training.
setup: "Train two 7B parameter models on identical dataset: one dense, one MoE with 8 experts and top-2 routing."
configuration:
  model_size: 7B
  experts: 8
  top_k: 2
  dataset: FineWeb-Edu
  hardware: 8x A100 80GB
dataset: FineWeb-Edu deduplicated
hardware:
  - 8x NVIDIA A100 80GB
  - 400GB shared memory
result: MoE model achieved 98.2% of dense model perplexity with 35% less compute.
failure_mode: Expert collapse detected in 2 of 8 experts after 50k steps.
interpretation: MoE shows promising compute efficiency but requires careful expert routing initialization. Expert collapse suggests need for better load balancing strategies.
follow_up:
  - Experiment with different expert initialization schemes
  - Test larger expert counts (16, 32)
  - Evaluate on downstream tasks beyond perplexity
---

This experiment validates the efficiency hypothesis for MoE architectures and identifies key failure modes to address in future work.
