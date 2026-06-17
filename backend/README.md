# 数据收集后端

为静态站点 [scu-freshman-guide](../) 提供：

- **访问统计**：页面浏览、志愿模拟次数（匿名会话 ID）
- **档案汇总**：用户勾选同意后提交的省份、科类、位次
- **管理看板**：`/admin` 输入 `ADMIN_TOKEN` 查看汇总

## 本地运行

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:ADMIN_TOKEN="dev-secret-token"
uvicorn main:app --reload --port 8000
```

- 健康检查：http://127.0.0.1:8000/api/health  
- 管理页：http://127.0.0.1:8000/admin  

## 启用前端上报

编辑 `data/site.json`：

```json
"analytics": {
  "enabled": true,
  "apiBase": "https://你的后端域名"
}
```

推送 GitHub Pages 后，用户需先点「同意统计」，保存档案时勾选「同步至团队后台」才会上传位次。

## 部署（Render 示例）

1. 新建 **Web Service**，Root Directory 选 `backend`
2. Runtime：Docker 或 `pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port $PORT`
3. 环境变量：
   - `ADMIN_TOKEN`：随机长字符串
   - `ALLOWED_ORIGINS`：`https://luoyedashi.github.io`
4. 挂载 **Persistent Disk** 到 `/data`（否则 SQLite 重启后清空）

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/events` | 批量事件 |
| POST | `/api/v1/profile` | 档案 upsert |
| GET | `/api/v1/stats` | 汇总（Header: `Authorization: Bearer TOKEN`） |

## 合规提示

- 收集位次属于个人信息，务必在 `legal.html` 中保持说明一致
- 勿将 `ADMIN_TOKEN` 提交到 Git
- 商业使用前建议咨询当地合规要求
