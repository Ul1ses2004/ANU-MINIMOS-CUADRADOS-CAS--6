"""Cálculos y empaquetado de la presentación; ejecutar desde cualquier carpeta."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'outputs/petroleo/dist'
OUTPUT = ROOT / 'outputs/Caso-6-Petroleo.html'
YEARS = [1880,1890,1900,1905,1910,1915,1920,1925,1930,1935,1940,1945,1950,1955,1960,1962,1964,1966,1968,1970,1972,1974,1976,1978,1980,1982,1984,1990]
PRODUCTION = [30,77,149,215,328,432,689,1069,1412,1655,2150,2595,3803,5626,7674,8882,10310,12016,14104,16669,18584,20389,20188,21922,21732,19403,19608,17153]

def fit_model(years, y, degree):
    import numpy as np
    x = (years - 1880) / 10
    a = np.polynomial.polynomial.polyfit(x, y, degree)
    pred = np.polynomial.polynomial.polyval(x, a)
    residual = y - pred
    grid = np.linspace(1880, 2006, 400)
    errors = []
    for i in range(len(x)):
        mask = np.arange(len(x)) != i
        c = np.polynomial.polynomial.polyfit(x[mask], y[mask], degree)
        errors.append((y[i] - np.polynomial.polynomial.polyval(x[i], c)) ** 2)
    v = np.vander(x, degree + 1, increasing=True)
    return dict(normal=(v.T @ v).tolist(), rhs=(v.T @ y).tolist(), degree=degree,
                coef=a.tolist(), r2=float(1-sum(residual**2)/sum((y-y.mean())**2)),
                rmse=float(np.sqrt(np.mean(residual**2))), loo=float(np.sqrt(np.mean(errors))),
                pred=pred.tolist(), res=residual.tolist(),
                curve=[[float(t),float(z)] for t,z in zip(grid,np.polynomial.polynomial.polyval((grid-1880)/10,a))],
                future=np.polynomial.polynomial.polyval((np.array([1995,2000,2006])-1880)/10,a).tolist())

def calculate_data():
    import numpy as np
    years, y = np.array(YEARS), np.array(PRODUCTION)
    x = (years-1880)/10
    v = np.vander(x,7,increasing=True)
    return dict(years=years.tolist(), y=y.tolist(), x=x.tolist(),
                models=[fit_model(years,y,d) for d in (2,4,6,8)],
                normal=(v.T@v).tolist(), rhs=(v.T@y).tolist())

def render_data():
    return 'const DATA='+json.dumps(calculate_data())+';'

def assemble_html(data=None):
    html = (DIST/'index.html').read_text(encoding='utf-8')
    html = html.replace('<link rel="stylesheet" href="style.css">','<style>'+(DIST/'style.css').read_text(encoding='utf-8')+'</style>')
    for name in ('data.js','app.js'):
        content = data if name == 'data.js' and data is not None else (DIST/name).read_text(encoding='utf-8')
        html = html.replace('<script src="'+name+'"></script>','<script>'+content+'</script>')
    return html.replace('href="favicon.svg"',"href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E\"")

def verify_current():
    data = render_data()
    assert data == (DIST/'data.js').read_text(encoding='utf-8'), 'Los datos recalculados difieren.'
    assert assemble_html(data) == OUTPUT.read_text(encoding='utf-8'), 'El HTML generado difiere.'
    print('Verificado: cálculos y página idénticos a la versión actual.')
    print('SHA256 HTML:',hashlib.sha256(OUTPUT.read_bytes()).hexdigest())

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('accion',choices=('verificar','datos','html','todo'),default='verificar',nargs='?')
    action = parser.parse_args().accion
    if action == 'verificar':
        verify_current()
        return
    if action in ('datos','todo'):
        (DIST/'data.js').write_text(render_data(),encoding='utf-8')
    if action in ('html','todo'):
        OUTPUT.write_text(assemble_html(),encoding='utf-8')
    print('Completado:',action)

if __name__ == '__main__':
    main()

