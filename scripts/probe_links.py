#!/usr/bin/env python3
import ssl, urllib.request
HEADERS = {"User-Agent": "Mozilla/5.0"}
CTX = ssl.create_default_context()
urls = [
 "https://zs.scu.edu.cn",
 "https://www.scu.edu.cn/zsxx.htm",
 "https://yx.scu.edu.cn/",
 "https://xszz.scu.edu.cn/",
 "https://slsd.scu.edu.cn/",
 "https://cs.scu.edu.cn/",
 "https://scupi.scu.edu.cn/",
 "https://gaokao.chsi.com.cn/sch/schoolInfo--schId-10610.dhtml",
 "https://gaokao.chsi.com.cn/zsgs/zhangcheng/",
 "https://gaokao.chsi.com.cn/zsgs/mdgs.jsp",
 "https://bm.chsi.com.cn/jcxkzs/sch/10610",
 "https://gaokao.chsi.com.cn/zzbm/",
 "https://jwc.scu.edu.cn/",
]
for u in urls:
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=HEADERS), timeout=15, context=CTX)
        print("OK", r.status, u, r.geturl())
    except Exception as e:
        print("FAIL", u, str(e)[:70])
