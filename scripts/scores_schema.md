# scores.json 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `year` | int | 高考年份 |
| `province` | string | 省份简称，如「四川」 |
| `exam_mode` | string | `老高考` / `新高考` |
| `category` | string | `理工`/`文史`（老高考）或 `物理`/`历史`（新高考） |
| `batch` | string | 批次名称 |
| `control_line` | int \| null | 省控线/特控线 |
| `min_score` | int \| null | 川大该省该科类最低录取分 |
| `min_rank` | int \| null | 最低位次（如有） |
| `note` | string | 备注，如专业组编号 |

## 更新流程

1. 从 [四川大学本科招生网](https://zs.scu.edu.cn/zsxx/lqfs/) 抄录或导出表格
2. 填入 `data/scores_import.csv`
3. 运行 `python scripts/fetch_scores.py --csv data/scores_import.csv`
