"""Combine the paired scene renders with the archived cloud plate."""
import argparse
from pathlib import Path

from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parent

def main():
    args=argparse.ArgumentParser(description=__doc__)
    args.add_argument('sky_plate',type=Path)
    args.add_argument('--draft',action='store_true')
    options=args.parse_args()
    with Image.open(options.sky_plate) as img:
        sky=img.convert('RGBA')
    for view in ('front','back'):
        suffix='draft' if options.draft else 'alpha'
        with Image.open(ROOT/f'{view}-{suffix}.png') as img:
            island=img.convert('RGBA')
        if not island.getchannel('A').getbbox():
            raise ValueError(f'Empty {view} render')
        plate=ImageOps.fit(sky,island.size)
        if view=='back':
            plate=ImageOps.mirror(plate)
        plate.alpha_composite(island)
        label='preview' if options.draft else 'view'
        plate.convert('RGB').save(ROOT/f'{view}-{label}.png',optimize=True)

if __name__=='__main__':
    main()
