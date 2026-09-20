#!/bin/sh
# Re-parse every downloaded KEA PDF in data/raw into data/kea/*.json
set -e
K=https://cetonline.karnataka.gov.in/keawebentry456
run(){ python scripts/parse_kea_cutoff_pdf.py "data/raw/$1" --year $2 --round $3 --source-url "$4" --out "data/kea/$5.json"; }
run kea-2019-R2-gen.pdf 2019 2 "$K/cet2019/R2/engg_cutoff_gen.pdf" kea-2019-r2-gen
run kea-2019-R2-hk.pdf 2019 2 "$K/cet2019/R2/engg_cutoff_hk.pdf" kea-2019-r2-hk
run kea-2019-R3-gen.pdf 2019 3 "$K/cet2019/R3/engg_cutoff_gen.pdf" kea-2019-r3-gen
run kea-2020-R1-gen.pdf 2020 1 "$K/cet2020/R1/engg_cutoff_gen.pdf" kea-2020-r1-gen
run kea-2020-R1-hk.pdf 2020 1 "$K/cet2020/R1/engg_cutoff_hk.pdf" kea-2020-r1-hk
run kea-2020-R2-gen.pdf 2020 2 "$K/cet2020/R2/engg_cutoff_gen.pdf" kea-2020-r2-gen
run kea-2020-R2-hk.pdf 2020 2 "$K/cet2020/R2/engg_cutoff_hk.pdf" kea-2020-r2-hk
run kea-2020-R3-gen.pdf 2020 3 "$K/cet2020/R3/engg_cutoff_gen.pdf" kea-2020-r3-gen
for y in 2021 2022; do for r in 1 2 3; do
  run kea-$y-R$r-gen.pdf $y $r "$K/cet$y/R$r/engg_cutoff_gen.pdf" kea-$y-r$r-gen
  run kea-$y-R$r-hk.pdf $y $r "$K/cet$y/R$r/engg_cutoff_hk.pdf" kea-$y-r$r-hk
done; done
run ENGG_CUTOFF_2023_GENkannada.pdf 2023 1 "$K/cet2023/ENGG_CUTOFF_2023_GENkannada.pdf" kea-2023-r1-gen
run ENGG_CUTOFF_2023_HKkannada.pdf 2023 1 "$K/cet2023/ENGG_CUTOFF_2023_HKkannada.pdf" kea-2023-r1-hk
run ENGG_CUTOFF_2023_R2kannada.pdf 2023 2 "$K/cet2023/ENGG_CUTOFF_2023_R2kannada.pdf" kea-2023-r2-gen
run ENGG_CUTOFF_2023_HK_R2kannada.pdf 2023 2 "$K/cet2023/ENGG_CUTOFF_2023_HK_R2kannada.pdf" kea-2023-r2-hk
run kea-2023-R3-gen.pdf 2023 3 "$K/cet2023/ENR2_CUTGENenglish.pdf" kea-2023-r3-gen
run ENGG_CUTOFF_2024_GEN_R1kannada.pdf 2024 1 "$K/ugcet2024/ENGG_CUTOFF_2024_GEN_R1kannada.pdf" kea-2024-r1-gen
run ENGG_CUTOFF_2024_r1_hk_prov.pdf 2024 1 "$K/ugcet2024/ENGG_CUTOFF_2024_r1_hk_prov.pdf" kea-2024-r1-hk
run ENGG_CUTOFF_2024_GEN_R2kannada.pdf 2024 2 "$K/ugcet2024/ENGG_CUTOFF_2024_GEN_R2kannada.pdf" kea-2024-r2-gen
run ENGG_CUTOFF_2024_HK_R2_FIN.pdf 2024 2 "$K/ugcet2024/ENGG_CUTOFF_2024_HK_R2_FIN.pdf" kea-2024-r2-hk
run ENGG_CUTOFF_2024_GEN_EXT_RNDkannada.pdf 2024 3 "$K/ugcet2024/ENGG_CUTOFF_2024_GEN_EXT_RNDkannada.pdf" kea-2024-r3-gen
run ENGG_CUTOFF_2024_HK_EXT_RNDkannada.pdf 2024 3 "$K/ugcet2024/ENGG_CUTOFF_2024_HK_EXT_RNDkannada.pdf" kea-2024-r3-hk
run kea-2025-R1-gen.pdf 2025 1 "$K/ugcet2025/PROF_CODE_E_R_R1english.pdf" kea-2025-r1-gen
run kea-2025-R1-hk.pdf 2025 1 "$K/ugcet2025/PROF_CODE_E_H_R1english.pdf" kea-2025-r1-hk
run kea-2025-R2-gen.pdf 2025 2 "$K/ugcet2025/PROF_CODE_E_R_30082025english.pdf" kea-2025-r2-gen
run kea-2025-R2-hk.pdf 2025 2 "$K/ugcet2025/PROF_CODE_E_H_30082025english.pdf" kea-2025-r2-hk
run kea-2025-R3-gen.pdf 2025 3 "$K/ugcet2025/PROF_CODE_E_R_11092025english.pdf" kea-2025-r3-gen
run kea-2025-R3-hk.pdf 2025 3 "$K/ugcet2025/PROF_CODE_E_H_11092025english.pdf" kea-2025-r3-hk
