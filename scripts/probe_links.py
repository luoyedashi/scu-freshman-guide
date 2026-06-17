#!/usr/bin/env python3
import ssl
import urllib.request

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
CTX = ssl.create_default_context()
URLS = {
    "scu_official": "https://www.scu.edu.cn/",
    "scu_zs_portal": "https://www.scu.edu.cn/zsxx.htm",
    "scu_zs_home": "https://zs.scu.edu.cn/",
    "scu_qiangji_charter": "https://zs.scu.edu.cn/info/1091/3364.htm",
    "chsi_school": "https://gaokao.chsi.com.cn/sch/schoolInfo--schId-10610.dhtml",
    "chsi_charter": "https://gaokao.chsi.com.cn/zsgs/zhangcheng/",
    "chsi_plan": "https://gaokao.chsi.com.cn/zsgs/mdgs.jsp",
    "chsi_qiangji": "https://bm.chsi.com.cn/jcxkzs/sch/10610",
    "uestc_home": "https://www.uestc.edu.cn/",
    "swjtu_home": "https://www.swjtu.edu.cn/",
}

for name, u in URLS.items():
    try:
        r = urllib.request.urlopen(
            urllib.request.Request(u, headers=HEADERS), timeout=15, context=CTX
        )
        print("OK", r.status, name, u)
    except Exception as e:
        print("FAIL", name, u, str(e)[:80])
