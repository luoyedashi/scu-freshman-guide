# 川大新生指南 · scu-freshman-guide

面向四川大学新生的微信 H5 单页站：历年分数线、招生政策外链、专业介绍，以及团队升学规划与家教服务。

**本网站非四川大学官方招生网站。**

## 在线地址

**https://luoyedashi.github.io/scu-freshman-guide/**

微信分享二维码：`assets/share-qr.png`（重新部署后若换域名，运行 `python scripts/generate_qr.py --url <新地址>`）

## 本地预览

静态站点需通过 HTTP 服务打开（ES Module 不支持 `file://`）：

```powershell
cd d:\agent\scu-freshman-guide
python -m http.server 8080
```

浏览器访问 `http://localhost:8080`

## 目录

| 路径 | 说明 |
|------|------|
| `index.html` | 主页面 |
| `data/scores.json` | 各省历年分数线 |
| `data/policies.json` | 招生政策外链 |
| `data/majors.json` | 专业目录与深度介绍 |
| `js/` | 筛选与渲染逻辑 |
| `assets/brand/` | 团队 Logo（替换 `logo-placeholder.svg`） |
| `share-card.png` | 微信分享封面图（500×400） |

## 更新分数线

1. 从 [四川大学本科招生网 · 历年录取](https://zs.scu.edu.cn/list.jsp?urltype=tree.TreeTempUrl&wbtreeid=1105) 抄录数据
2. 填入 `data/scores_import.csv`（可先运行 `python scripts/fetch_scores.py --template` 生成模板）
3. 执行 `python scripts/fetch_scores.py`

字段说明见 [`scripts/scores_schema.md`](scripts/scores_schema.md)。

## 替换团队品牌

1. 将 Logo 放入 `assets/brand/logo.png`
2. 修改 `index.html` 中 `.hero__title`、页脚团队名
3. 将微信二维码图片替换 `.cta-box__qr` 区域（或改为 `<img src="assets/brand/wechat-qr.png">`）

## 部署到 GitHub Pages

```powershell
# 在仓库根目录或单独仓库
git add scu-freshman-guide/
git commit -m "Add SCU freshman guide site"
git push

# Settings → Pages → Deploy from branch → /scu-freshman-guide 或 main / root
```

若站点在子目录，确保 `og:image` 使用绝对 URL。

## 免责声明

- 分数线、政策信息来源于公开渠道，仅供参考
- 最终以各省教育考试院及四川大学官方公布为准
- 家教服务为信息中介，不承诺升学或成绩提升结果

## 首发数据范围

分数线：四川、陕西、重庆、云南、贵州 · 2022–2024 · 普通类一批/本科批

专业：18 个学院 · 40+ 专业 · 15 个深度介绍卡片
