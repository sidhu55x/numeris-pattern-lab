"""Import official national MAIN draws. Requires curl and pdftotext (Poppler)."""
import re,json,datetime,subprocess,tempfile,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
ARCHIVE='https://www.wclc.com/display-on/display-on-downloads/lotto-max-since-inception.htm'
RECENT='https://www.wclc.com/winning-numbers/lotto-max-extra.htm'
def pool(date): return 49 if date<'2019-05-14' else 50 if date<'2026-04-14' else 52
def validate(rows):
    rows=sorted(rows.values(),key=lambda r:r['date'])
    for r in rows:
        n=r['numbers']; p=pool(r['date'])
        assert len(n)==7 and len(set(n+[r['bonus']]))==8 and all(1<=x<=p for x in n+[r['bonus']]),r
    expected=[]; d=datetime.date(2009,9,25); end=datetime.date.fromisoformat(rows[-1]['date'])
    while d<=end:
        if d.weekday()==4 or (d.isoformat()>='2019-05-14' and d.weekday()==1): expected.append(d.isoformat())
        d+=datetime.timedelta(days=1)
    missing=sorted(set(expected)-{r['date'] for r in rows})
    assert not missing, f'Missing draws: {missing}'
    assert len(rows)==len(expected),'Unexpected draw dates'
    return rows
def main():
    rows={}
    with tempfile.TemporaryDirectory() as tmp:
        pdf=pathlib.Path(tmp)/'history.pdf'; txt=pathlib.Path(tmp)/'history.txt'; html=pathlib.Path(tmp)/'recent.html'
        for url,path in [(ARCHIVE,pdf),(RECENT,html)]: subprocess.run(['curl','--fail','--retry','3','-sSL',url,'-o',str(path)],check=True)
        subprocess.run(['pdftotext','-layout',str(pdf),str(txt)],check=True)
        for line in txt.read_text().splitlines():
            m=re.match(r'^\s*([A-Z][a-z]+ \d{1,2},?\s*\d{4})\s+((?:\d+\s+){7}\d+)',line)
            if m:
                date=datetime.datetime.strptime(re.sub(r'(\d),?\s*(\d{4})',r'\1, \2',m[1]),'%B %d, %Y').date().isoformat(); nums=list(map(int,m[2].split()))
                if date=='2020-12-31': date='2019-12-31'
                if date=='2025-01-02': date='2026-01-02'
                # WCLC PDF prints 374 for this bonus; independent draw record confirms 37.
                if date=='2026-03-03' and nums[6]==61: nums[6]=31
                if date=='2022-01-25' and nums[7]==374: nums[7]=37
                rows[date]={'date':date,'numbers':sorted(nums[:7]),'bonus':nums[7],'source':ARCHIVE}
        for m in re.finditer(r'class="pastWinNumDate">\s*<h4>\s*\w+,\s*([A-Z][a-z]+ \d{1,2},?\s*\d{4})\s*</h4>\s*</div>\s*<ul class="pastWinNumbers">(.*?)</ul>',html.read_text(),re.S):
            date=datetime.datetime.strptime(re.sub(r'(\d),?\s*(\d{4})',r'\1, \2',m[1]),'%B %d, %Y').date().isoformat()
            nums=list(map(int,re.findall(r'class="pastWinNumber">(\d+)</li>',m[2])))
            bonus=int(re.search(r'Bonus</span>(\d+)',m[2])[1])
            row={'date':date,'numbers':sorted(nums),'bonus':bonus,'source':RECENT}
            if date in rows: assert rows[date]['numbers']==row['numbers'] and rows[date]['bonus']==bonus,'Sources disagree'
            rows[date]=row
        rows['2024-11-26']={'date':'2024-11-26','numbers':[20,24,31,33,36,41,49],'bonus':50,'source':'https://www.lotto.net/canada-lotto-max/numbers/november-26-2024'}
        rows=validate(rows)
        data={'fetchedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':[ARCHIVE,RECENT],'corrections':[{'date':'2019-12-31','field':'date','raw':'2020-12-31','value':'2019-12-31','source':'https://www.lotto.net/canada-lotto-max/numbers/december-31-2019'},{'date':'2026-01-02','field':'date','raw':'2025-01-02','value':'2026-01-02','source':'https://www.lotto.net/canada-lotto-max/numbers/january-02-2026'},{'date':'2024-11-26','field':'row','value':'20 24 31 33 36 41 49 + 50','source':'https://www.lotto.net/canada-lotto-max/numbers/november-26-2024'},{'date':'2026-03-03','field':'numbers[6]','raw':61,'value':31,'source':'https://www.lotterypost.com/results/zz/lottomax/extradraws/2026/3/3'},{'date':'2022-01-25','field':'bonus','raw':374,'value':37,'source':'https://www.lotto.net/canada-lotto-max/numbers/january-25-2022'}],'archiveSha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'draws':rows}
        dest=ROOT/'dist/data/history.json'; dest.write_text(json.dumps(data,indent=2)+'\n')
        print(f"Validated {len(rows)} draws: {rows[0]['date']} → {rows[-1]['date']}")
if __name__=='__main__': main()
