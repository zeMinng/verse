<template>
  <section class="verse-hero" aria-hidden="true">
    <svg
      class="verse-hero__background"
      viewBox="0 0 1000 560"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <!-- Full-bleed background: stretch to the entire component, independently of the logo aspect ratio. -->
        <radialGradient id="ambient-gradient" gradientUnits="userSpaceOnUse" cx="500" cy="245" r="400">
          <stop offset="0" stop-color="rgb(var(--verse-accent-rgb))" style="stop-opacity: var(--verse-ambient-start-opacity)" />
          <stop offset="0.55" stop-color="rgb(var(--verse-accent-rgb))" style="stop-opacity: var(--verse-ambient-mid-opacity)" />
          <stop offset="1" stop-color="rgb(var(--verse-accent-rgb))" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="vignette-gradient" gradientUnits="userSpaceOnUse" cx="500" cy="263.2" r="573.4">
          <stop offset="0" stop-color="rgb(var(--verse-shadow-rgb))" stop-opacity="0" />
          <stop offset="0.42" stop-color="rgb(var(--verse-shadow-rgb))" stop-opacity="0" />
          <stop offset="1" stop-color="rgb(var(--verse-shadow-rgb))" style="stop-opacity: var(--verse-vignette-opacity)" />
        </radialGradient>
        <pattern id="grain-dark-pattern" width="160" height="160" patternUnits="userSpaceOnUse">
          <image href="data:image/png;base64,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" width="160" height="160" />
        </pattern>
        <pattern id="grain-light-pattern" width="160" height="160" patternUnits="userSpaceOnUse">
          <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAg4klEQVR42uVd2XYisa6t//8WCHOAJBTzHL6pzsNdqiOERttF+qzrp+6EUB6kvbdk2VU1pP38/Dz9f71eN4fDoeHa19dXk9J2u537s7+/v03TNM3lcmnm83mT2jabjetzvV6vKdmOx+PLnHrHnDt31+tV/f16vWZ/frvd2rUdDAZsf76/v9XvXq1W7d/T9ng82n9X2pcMh0P1IdPpNGlRrtdrc7vd2v9/fHy4J5oOfDqdNvf7/elnksNw7Xw+v4wVJnw2m6l/OxqN2J97DY7OHyxa1w3GKhlgjk3gtt/vzc9U2oRut9vWEDQEiSy41bB3dNn6/f6TsWGD77IPn5+fWchW1/XTnHNOcrlcWse2nCgVYFLXnBplRekC2mKxcNNCbkul8ii1cXQg9QcMFBsGRdrUtt1uw3LgeDw2y+VSpPmumjRmi4K9MqzqGmk441qv1+zPJ5NJMWMr3TiZ8O7nnU4nN7KnNAw6HvrEjerz4XDIalDKANVms2l1UFQoRwW7JIo5z6ZUk6pDsVHDZ3OCma4kw3g8VrUWpVIwUMpUkWdJciCC0ikaGc9/lTPRXUK/pZPAQEuiE9AK51hARXTBrUgzyhKj0SjJQSyDkehbo1KYV+lvS7QQBXNREw1OJKO00iCR9ALVSBp1p6JzqYgUAoJ3t+v12pzPZ5FBuOAEPquthRQLpOr4ikMUT8AhoY5GSVwQADQwHo/DkVVKGiGig3KcBPcNL/ZsNhOfsVwu2znC0kJDqS4NnMoCjIbYQTFCRqPu4kGINiE5dCXREnYEafDeJDQ4g0dacAgZ1WOAGpphW3MGwUJJXQvOk+rg4DwWdR+Px/8aoBVW5+4QQOKZi64gckvRclT70IAKLy4Iey9lX6/Xtm+exfD2Pydv6k0ES33hUO3dDRumGwGjUB/1Hu/ieVG0RM7ucrm0z9NyiDk5MeowEeNcr9dhypOyBtr6/v7+Jie0YW4wUGBGSo6CNZrSKA8PJBpFc97P5QcpynoT0CUWUmo4P4fpsq5rN6rBMyOCH6N9xFFms1m7PlKaziM5cO6S2zatvMKa0paU4/GKWnhuSvRbslGklhBW01hejelNmfxVu9/vbTCKwQHv20sA4EmScwGuiIBeA4MHpySzIx3lkAQMCBAPR/KWE3ipTvpcdLx1XavZBW2RS+nx+XwuUikEYBKy42cCOnJ6PhpoVqW8OkUXcKiQspUE6Mw5jUaVKQlWzsitoAZLgBKJa4mev76+Xigv0o7Ho+hY9OelytaqriOkXq/3Z5STstjYiHNQHSNaaorE83zOYaPyaLVaqcZKZRLMK3ZGbwqKPqfyar4UVCuVfrBEusfQIimeuq5dn8eTHt0JoIvq/Xvv50rsDpWQSMkUnJKy+F9pYLARxM+pMiktXXAkORgM2r7hPkY0pdSixQqe1BtFyupfjcgiOiZiHBiFNWS1UkQU8XGaihPnXWrqUqiZa6RaukvSjJXUObo4Efrs9/vNbDZ72q6SdIm16Q/6CYvrXq/XDjay/aV59LuQHkehtD/U6IGmo8/UsgGS03H5VG8NJqdxpbmmfQtTcF3XyWdBJPQ4Ho9uOuTQDryLJjmlbbSUXRKvoVv1gZGk+Gq1etKieI5SNR52ZMv53yE7Oq+IThW0uYNfLpduo/n+/i5+DsRrICV2abhnac/n5IUX7ajzfnx8mAEbsOzxeHzJQ1YcRWj5MUAbPIiSlRhc4zRVNIdXsnSLCnxYgAhVwndYhq8lr7GR4aiaM+pUQ08pEIFnebYYO0dALSflKfq0kERLwWy3287TEaka0juu+Xz+lgBGWwsquU6n04tDAwjh3KVlvHVdN1XUM4DWNNTzbnrPZrOnTkbOnKa20gfPLQ3l3SO1mqSR6ZyBsXjkB/edkrHnspzEQK0BYqOR9gthMjH9RbSaVhMIEwbfF8nmewz+3afaSjWvNouWhGmRshZk0nVJ3T0DBqi06Cel4gXTn9cIQE9CqofquxzUAkrQkIh6d9Tbvfqyq2R9JJfr6cNisWAzBRpDpSJ9JX0pN6h3XB2BPVny0tTTeJxn5+wY5DiohXKR5HGXp9Y0La6hM9XmVBKAwVbv8FoJ0rvM0Eebp5SLiuycBonaSII/N/+as5apwZwFFlXpFEW0A94F6KpSh6Y6MJWU2Ka83++q/uz3++YpxAjCeQp8pc9QGgUplgoUFi0vl8tYGsZzXQPnZQDH0kRLUG4tDPZKK4I+Ho9Pn/nX0jN4HkrdQZPSMFVCjvJwOBSTGywCeqJEKRDAaZx+v/9kpMvlstnv962ug2dwNCYZYTR6PRwObZ9gi280GjXn87m53++sg3jpl9PBJS9t8i5y9N4WYLmUKqAoU3kzIWBPVW5EA4aDxXyJUqDSCwqLBgaUKjs8RnI+n5vz+fyyy3G/3006i8w9NqSSgQisH2UVTU7hfmOKX61Wzc/PjzjuqlReiSIKhwySCI4mw0vTpyQRqOjn0Jj23UIXTiqkaCzN4K7XK/udXhTjdpe4AAicOmenprJoKOX2Jc9kRSM67vMpJffUQNbrtZuCS5RzlXAgKU9HW+Qsb851LB4NzkmCr68vXxBCkQtrOFhQ7yJaSd75fF6MwrFei1S7aAuHHQHGEvnulDRONMk7Ho+fUAl0uIaAWFd6EBkbbM7R2koSnLvdrkWY/X6v8n/X5fjeBQY9OpvNREPHKIYnGiMjHSs2ZM4YOF347hynB53B+IHVsKOl9henqlI2CNxpmIgmfDweqqdTWh+Px+GrH7Rrwrj9aTBObe+a0rOHKqUC2dzNe+7SdI1ptPXBfYHgCwxO+r6IQW42GzGos6SC2wAtWuS26Sxo7vLeaalFAx5pDBKdWduVmC1yi26lvXOrgXFFtWjOhefSvLsNkHoKtfgubksF1LK8PvdIKBfgbLfb8ITfbrekymJsiJvN5onWoknpnHwdngdK6VY/vLlJLFfW63VTzefzJyS6XC6darrT6dScTid3hQvo0N1uZ0bkvV6v+fj4SErURmnRE6lqDhtNrWCH9KBb1Dija84ZZEowUsHCcVSLEUCilhIVMuPxuKUDTuRfr9cnhMWDt4xCWrR337oPqCZREYwvYgiAUnQOer1ea/CWUXBGSfWrV/97dljovBcryZ9MJi8diGoc3LnD4ZCU4IS/ie5dggEsFou37OSA01Ok9BRAANLTz2PjzdFr0Xa73Z7oO+LclaX1onmurnRgajDz+fn5lLAGJ4EoXaNGPKnL5TKkr7q8dg76vN1uOysS8FBzieMNVTS35Ilcc8uYaFBgIVLu8yRaBCpK1ZSldk5yWKXkfGFq5uhW2ymRbpp1UbAnJ+TZFqMe8w4dVuLc7fV6TaY0LxJyn4ukqbbb7ROae7cpUw6C0Rv8cRwQDWYqL4SDdXO5IwgcuEFrXsF913w+ZxfDQsHcd5eVbl1QI9WLgMwlXxaZ01J2U8xihHe38XicRanvLjSN3kogURh11BzkPhwOxW+sTW3S262So2CA26jX7fd7cVJTaCDH0Lyb+x6RrSE8oLKF3nRe9vt9uCAg6uS4lajAlvrLfTc2xMqjbehAOZ7PKYjE2gV0oXTdLiwmDAL6Jnk8fHfJ60Pu93tSlAsU+q67FDXD1zIbWv/oPGMDw797PB4qSIFcqywdIw0iWr7TVSrCalwu8fF4dPLqBkDNd8mZ0ofJJKPkGCo38wAAU3FpD42OtNeK7na7Ykgj0XLKJeG0afvWPz8/T8+2jCmSLE+dG4wygBzQx/1+n5WasRjwfr93emqyKolggJbcnq2XoqkxAYzj7/R8F9V5pVHJU57vjeBT0jg5OcbhcNgiGPQtRRak6HD3JeWSCI/cpp4q7CXhLIllqj1SkBCnkDC9DIfDZrPZFNsNSkmZ5Ca0U/tupZIWi0U42qbMVvx6NowMWoToRaS6rtVF8yIrGC9FI+nvwfC8usuLBpwxSPMkIScOCuG5n5+fYmFIql7DcyMZI11HKTLHc4kdqipFFTkNaxhrd2Sz2ah0wdF/zhVpMPEY3XEfS2yNUR32joPp0hxGshkADuv1+oXZvNq4siLcEq1UZUa0ICBFDmBappqui6Jby/FTA4B/JRGttev1+l8D7LqqwmPUvV5P1TtaHyPJ7C63rg6Hg9oXiaKok/Z6vWKXW3o1ttQGg0F7s4I0d5wTha/otYpLc6hhOByye8VSagK0EjXcnPxTl+mECO1EI/L1eh2iRk6GaMYQjYAfj0fT6/WKMGX1l7V+uQYhoSWM6Z3X8eZQK6d7qWP+/PyoGQjvBQIYwVJ2r0rr06QomE4Ol//6F2+f8iJ16Ys4o5cBeUqpojs54IxA65G/9/R/Pp8nVZNX3jwTtXxpANZtVrni2BMISLSeSt9SfhM/h0MTD7V5c3wejZ67I2IFi9vttjiruBHQEu6r1aqlgfF4rBrKfr9vNpuNiJJ4Z8YD+SXPF1OtZL0ZyhsoaMY/HA6zd2pSGAfLL3CgXIDwoDdmmMoa+LtPj6W28/kcXgQJMbDzYOSxjK2u67Cgx/Pb1cusPc6QewlVakFwSAOeTqdkbYcpigt8PBHVcDgUhTOeQI0mSjhUinjH84YPSnX1Ehq6TtjZurju+K1BCF0EzXusCYaJSklWgzHN5/OWJksvKMgBT8QuZRRy6VUakyRzIrfKeoMGrFWXy6WpSb1M4DZAj9dIG/rWpEWqcVJvis81TE3DgU6lwQ/VU1wwk5uKkvZYS+tFKyBLiRuyEFALMLRI1NI5lgi2DKmrQtMSqBZJ3IJT4qCIMg2nYT3Xl5QIziJBIjZEapRVaaSIBA1dGQ1daECZVP1H5QGml+12q0bhljgHNLKQnS605agUqSSqnU6nrHGlBhWcDJlMJi/9N19Us9lsXngeLv55x0sFo55pTRjXZwkNUgt0OTpN3TngpEoqelHjpkEUdjCPflwsFqbDeJP5SRQMMOrNGQEtlCr34i64TKUHq9EFSa2I4ei33++/GG1d19mFIRpARIIqDZywjuTuBfLqatMAV6uVuZCcFtEEaDTi9U6W5L3veMddrhjHBkrRBdOpF51LvIu5FAVrOrr6q0XJvcmg67e0eyL9aPNqXY+DdlFoIQVWJYpuVQq2qPR6vT4FJ1qOZ71em/qgqwsku0rhAKVpqZj1eu1COk2GeBPceL3qug5pcqB3TJklK1yitZZJCEijQNrwllVd16Zugs/TaBImJjpBGEGs7bMIEqdG0dhAUgK4ki/b5p4P3+/VnpKRRY1vMpnIBojRAh98oUZCk5/4/1SHdI18lJYk7cgZ5X6/7/QsRqnqZk/lMX0WAEZUew8Gg86lTsUZnUUFu92uFcNUdHZxsCm3aLbLggoPolm6EZAnKhGkpLNnR4TqUex80fnO0cXVeDwOJYJT6CDnUBKgWKTKRHMCkAyA6n/xqghPKqdUwQBlBQ2Jp9Opev462jwVNlWOZ3clTC2jpYhGDY56JHg0RyelDNCbH/z+/s5+83kkMrbSNpEyLAADr3PQ4BaQGa9XBXBs0RQeSI4ohofT0L70pdrWeFK1De63tbiePFsJyYINTxrXu/bIPZSPAam6XC5qnkfyVi+qWXoEDEX7vtSdgZSCAU3PlIxGub55vh8jLZc+k9YrYugeTVfq3HGVAsUpaOGF9xTa4xYzB1Eje8Ep97aUon3qmNQoONTj9N12u30JPLk+RoM5DjjUapgujzEuFgsXIr3rMDY4XBfVP7CYp9MplHrysAqHkl4509WBfEr7GpjQvHHltVwNzaJowwl2MAhuD7PU6+glatEibJgwKSjD1Jaj5y6XSyj6lD5rBUN1XTePx6NdY8koI1F4Tn63spDPMyk0b5SjlbqqRwSq9GzSb7fbUG6LGmckIvbSM4cqFqNwjqXNb3R/Xnp+JMCrvGjV6/Var7HO11p60uNd3tJvjI7S7QHaxEbSPf9rbTQatQ7HadVovi/37U+w7ti5VQ1oJX/P53MznU7bRaciOEKdnOenFIbCGPAgcTqk1+uFJp4uHNCNpHMs9IuMSbsNrEvnkOYHgGU4HIppHUBYLdeJX7JYaVQSgeacCdEWxVuzFqltOx6PyVE/OBmdky73elPQaLFYPDlh6ngpCJU+C2NScGRHxJNKKV1bVjI3NxgMzIXFqI7Hezwe24n2ID+3KB5pMpvNkpPK2Gmk3Gr0YD2+JD3lnumqRH4r9Q5jPCHf39/FXreleWkUqUrsyea+0gAczYtiWqAlFRp4jQdr5mjAOBgMXq4+rjyUykWE+/2+GY/HT4jxjneWSYPu6rT/7XbL3sYCWo1u/4Ejga7kxk6lD2UhrbLldDqp8gc7q5cJwy8rlOD4eDxmlUFZ2X5PqgJP7vF4FOkR+n+9XlXx60EiTJ8U2b3o6UUGGB8N/sBQPUULmDWwMUWPinLa83g8ipq01PuQqxTjKRmmY+MH6oCJzH0Xhlfc/9WhJWzsXSH4fr9vHc/S6HTdNQCKRPMaelbYq0tXv+YEHJRa6HHF8/n8ghylKz60DfcujBYi+cFg8MJKXJTfxVvZpYiVPguMOvW9d4Du2afiQPdZdwJaHtVVtMx5/fl8bo0Lfk9zX1p0TZ2DWzQpLbTb7drJj6RGJMThfs71xyN5wKnAkQG5urjAfjKZ+M4FgyF4J4sbPF5MLsmpRb904qbTqTvn50WpqDaM0ms0YwDO8a7CDNpXTntien48Hu06fn9/q0xhbWlWHKKBEeVWx0Sj4tR94C5efxrxejBgCTXxW4wolcHilcxnWnT61+2lIpoToNoCPB6PFpmolwKaUVENxuyt+9vtduzrCU6nU3M4HFh0KLE5ntO03SDLGaV5oX0v+RJGLvAB2i0dFFEmA6ettMiXTlpkD1UTyBzlRQKIFMTDCydFxNGyMmuRuDnQ5AM2Jo6ql8tls9lsWFrzUDumVo8e94JFZO2oDVWRD2sd6OKeETAIajARqsb6BFf2SGIenokXS9KS3AsNvYtxu93EQIsLLIBZ4HlYk4OhR3aScnad8LNTAxQYRyWhS4p+KPUmImogqTdSaUFIJAKlRoZlwf1+DyOn5/PY+T3j9+ZuU4tGYMwUOTFLek/7YeOvvHql1DFNMK5S5yKsQKnrd+B5g7XH49Hs93vR+LCzUImREwyW2Ie2pENOq6woxUrPRKIvTE+aZpFoDIxWO9W/Wq1Uo+O+GxY4tSACowIgTKkINLLw7yqg9coMmBeNGStJ25RsuS9MllADHIXLufX7fTcyeRad0rm3ZJ/+XVdbblKkbxmw5qxWHtWyE08etirtXVZaQNJeUUrmFlL6Dk5DcS8D5Nrn5ycrSeg4uIXkErSaM1JW0RzI0tu0z4vFopN8aW6gU+WmIrw5tsghH8935uzF5tLj7+9vUhojJR9Z6saIaL4Q+moZOgUCeK8wdUKKlhDpuxDQSqJqvwdkkVI6kYjQs7OyXq9NmjudTs10OhUR02Pc1mdyd5FyLgiSWMYKyCzJ00kQgj3DM2hISXBbR5o4hQWRdMPn52e2iJa+WzPcLg7jUwPAxuotY7LQkgaKkAJZrVYm2lnOgw0wVbN6txbfckf0O16KjfUNNTiax0s5bcf9DRgvjuilAoLS552xkXBBWGSM4/G4+f39FY0Nf1eptA6sVxWJeK0Sqfl87o6g6TYVnTD6PVaSUxLYvV7Phaw4WrS2IKMJ9786X3w4HNRAIHKILFJYAs7hCkJyUi4RrRA5VCMFDSlICiK4i+LNklGihJzYSEqhT1Q7arKFu4sxYlNVJCLUPsvRAPZ8z45E7qGmwWDQearBWyjL7Slb0WnO3TIp1eBa6gscwjNebt0ej8dTGkqi98oS8FoHYZIjd8Wlpk9KXFCU+9pULf2Q61R/dYGkZIS43565l+gWpJWE3klBSOq71LbbbdjQOVSQIqzI1beR6C6Hvr2GpT3jdDr9U+/no1SNjY+jcS0irmgqJLqAkoeXeP185AoNHGVydF9CP/3FheZSv63ABgxaonUtAIlo7ShyUwbMPpZp0RpMxF/fUSxF7VKkm8oGEjvcbjfVwbu8HJTTdqlRO7eOnDF7AtTv72+ZgimnR/JYFr15Dfzr66uZTCbNarXKPjPhFfie6pPUE3vaHGKk5/pKA0BqsCkUDeiqafjxePyCiCXv90lORO/3e9NrZ7NZa2wYKVOSst4J5jxcMj4rT5VbuWIFZ6UKeKVGNXHKKbvb7ZalgS3H/7O3ZeI2Go1ECqRGjgcE0RloPs+7fXNK0bkDUhqFYb1zOByeDM5CEUuzejStJY80rQfzhK87KeEwVNNXmsinG/ZWabik80BrQcBiIeBkMskaLLe4WH9Bf+73e2u88/mcRazr9dpst9uiG/RYe+J/ewOuSBbCkxdNzWpEGqAoBpTFYvF/COjpwGg0ao7H48uZkVLieTabsYscjaZT951Tzp1EneR2u4Uj6VTta/VtMpk01+v1ZX5zSu8BWIABYD21XGglBQUYpegkYE0wmUxCOxjUyy1kORwORRPIJRpG2C4Of3NRaL/fbzabjdsgYV4B4XMQHD+TGixGWKDtSDqv8qQFoimK3IsmsUFbWsfSUngcFjpauzTYEcBp5/N50RRTFMEl9ooGUBrTzGazl3UAxgDjtOYAOwA26Mojqj1bMTkVyiByS19wKTmC1Neo42y329YA6Hf+/Pw8BUx1XYfol1uL5XJZJBCgxklrDy1Jhv++3++382b1jbMj1+VE0YXxnGkFNEk1XBgsnSyaeqCTcr/fkxErik5dHUCigRVdH48soKwG80h3kWjAmLLDhdeEvkpDfU0DDMQTndHP0Pf8Wnk8bWB0Ia1dBa1xi0N/9vn52aKC9hyrarnkmeQSWhM7o7eAxJPAlxBRkwyj0agZjUY2AnIXRdKJyXn/LRd1fX19NePxuP0ddLpUMOLtr/cQETifZqzQd2sry6u3LblCAaF0USwAi3QO2lu91Fkiut/vhzRPZCspJdUCnrxYLLJKu2Dic6JKDn3ACK15AFSF8aSgbIlCkUjT5rvqssKDIg0+0GRBO77BdDAYNL+/vywifX9/q4ugoaa2EB6UlP5+uVyqFFfiJdV/3aR8ISAh1vYaqlccdWjenVI1crlcnmiGdr7rKmZsKFIA4umDtCeKAyHNcLko0cqjpgBEDqh4As6Suc9iFJwaWXIIBaJ2Pp8//R4WOidbD/msXBTq6vpcaR5pHg4j7HK5NC811/Qs1YtRrc2B0uPxeHJYySn+iWIEja66uLr2XUbj1ZOaU6WmcobDoXlGGLS0ZJyLxcKlt3GqjTrCx8eHGpxVnNVb5TcaDS+XyycKP5/PpkdhNOn1eu3nu8yjcZRbsuCABmHWHJR89jtOAEYCQXMveLfbtZTELXok+047Rr9vNpu5IB6+Jxqx5rzcBlM9iGgpfYGd0IpEuWQ8GEnkQJdWmlYyaJxMJs1kMklKe91utxeD4w69A+pWUdrjFoTSx+fnZ7GbAL6+vtrF8ubvpGfjm66id1h75yKKGlySH4zSMk6M4vS7uTGkIiMYYomTiS8IWMpQKPKk6KLxeNz0+32VjjzGAYYhLaCX2lPGEMlnTiaT1qlKJIoBtcfjceeH2D2A5QkWq91uF6IBvDDcA1IFuSd1UOp1rlowBAYEk0oFurV3jY0bjKCrA1mSthqPxy09Y5qmn9ekA3UIOg9WOk5Dy6f3hNB0AhjVZrMp5kWe74kiMaCkB81KpkwwjUnRo6SZKd3SeZHGknoHYxRYUp3ldDqF9CKWDslpGMsDOL0Gli8Z5Gq1Msvfred60zbYSKytKavm8B23f3nacrlsERqMNqL73rFDQ52z8iyqlirwZMUxbUkayTtRHJpdr9enZ2AjBFSxUDCab5RegmjJh1I3HMC4vEci4HPS5wH5wNlgPrR18cgm+F4JVDpLRH9/f78skkUJEjJqeiKadqEpka425iNUZjmfFf2XPKcbPaAE8+lFz91u1ywWi9dXdWmLSQeIDYvqGvDM0nBe+lwIRiJABTAaetzTG9FGEDESQUN/MIp7HC8l7dJVwCTJlCoXUfBAtQkvtYFNESv1SCEW/ODFXVcwl2jcDo6W6O663W43V1W7tG5VjjfkpEUikSkXBUaEP54gjFTveovm/0Jbr9cqlUeKjsEu8IF2CSiSNOD9fi+WFfeIXU+UhtM4kuNAHkxC45RkMIf6WHCnpjW4vqzXa9f55ZS3WOXo6JyMQAWLAlYLekjL3aXunqREgNQwYYDn87mTM7l1XTfz+bzIbQE5JwW5KNPSpFpAhY1Gi5y91E2NXGNDGgFj9qtw5/8/UJLmoZJjRaNM6XuslAneqdBQhktpQB+pjuU0o1axDchb17VZoQO/j+hNKr2y0zBAody20OVyYYMaaY8Q07pnH3GxWJj5u9LR+Hg8bg6HQ/KF65LB0YAqBT2lIMqbK+xi/1hzpMFg0FQpgQSlPhi4lNDmBGxUQ06n0yfvsV5l722WIVEEoWM5n8/N9Xpt1ut1cUnApZ40h+PGwq3vZDJpP4tTaoPB4EV7SmheKi2WjYCbzUZM3bzzlU//cvv9/X0y3BI1i1qA2EVbLBYh7e8FtqrrweTk1ubz+QuynU4nET3xwpaik9LXhXDOqT2jVLlcytEGrV8l0H673doISEW7RVlYu3V9nuPz81M1cOxAdV2rRnk+n9nUh5aaybmnBadnOI3Gjcs6uRdJgXhr+LhLNUGrDgaD5n6/t3KIRunWTlBd188G2JW34xQBRExRek6hLe/pue12m13RwqVt8Bi1FJSWPsFaS1vQVFqXno3Hw90THWFIjOJ0TSrN60BgY+O0EJAasTcKlRYIOg85sWgu0fN5K4ABuknd+eEkw/F4ZCPdlBq+VC0mRdrAFNzcHQ4H9ucSG+AomAOdStNfpVruvqSl53J0ZorOpX9jRfQlSrBKVoNrVC6tu7UDI+VKLRZyR8EaxFvaJOX6W2/DiKHtV2Lvk/JikgRJ2U77+flpRqNR6xzT6bT9Hoq48HOsyyKUKrHS5XJhUWe1WomSA/8c2MuTk5ScUAOP2+0mG6A2Ae868FLX9ZNReHckStAYPFd6Jvx8Mpk0l8ulk+oTTGtUylh5uOilRRhEvDlVbCMY5cE+PMl694tqSjQOeWAQFuV7JUFXkXfuzgcYkzfYAeTSDA10sYTc0cAkJxDDB6Fo/7T1q7wek1p16604jtC0pCu4QWpFBRJlA+Vst1uVfjDqzWazJwcDR8Bs8fHxwW435tyvmBMIeREOzyvn4FJgIhkjBrf/AGQ7XIuSNIHQAAAAAElFTkSuQmCC" width="160" height="160" />
        </pattern>
      </defs>
      <rect class="verse-hero__ambient" width="1000" height="560" fill="url(#ambient-gradient)" />
      <rect class="verse-hero__vignette" width="1000" height="560" fill="url(#vignette-gradient)" />
      <rect class="verse-hero__grain verse-hero__grain--dark" width="1000" height="560" fill="url(#grain-dark-pattern)" />
      <rect class="verse-hero__grain verse-hero__grain--light" width="1000" height="560" fill="url(#grain-light-pattern)" />
    </svg>
    <svg
      class="verse-hero__art"
      viewBox="0 0 1000 560"
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
    >
      <defs>
        <!-- Background effects mirrored from the original Canvas renderer. -->
        
        
        
        

        <linearGradient id="metal-top" gradientUnits="userSpaceOnUse" x1="160" y1="135" x2="850" y2="330">
          <stop offset="0" stop-color="#b5a8dc" stop-opacity="0" />
          <stop offset="0.055" stop-color="#8d80b2" stop-opacity="0.15" />
          <stop offset="0.13" stop-color="#e2def1" stop-opacity="0.72" />
          <stop offset="0.205" stop-color="#fff" stop-opacity="0.98" />
          <stop offset="0.29" stop-color="#d7d3e9" stop-opacity="0.97" />
          <stop offset="0.385" stop-color="#928aa9" stop-opacity="0.92" />
          <stop offset="0.465" stop-color="#f9f8ff" stop-opacity="0.99" />
          <stop offset="0.55" stop-color="#c3bdd9" stop-opacity="0.91" />
          <stop offset="0.635" stop-color="#fff" stop-opacity="0.99" />
          <stop offset="0.73" stop-color="#d9d4eb" stop-opacity="0.94" />
          <stop offset="0.82" stop-color="#897fae" stop-opacity="0.78" />
          <stop offset="0.91" stop-color="#e9e4f9" stop-opacity="0.78" />
          <stop offset="0.965" stop-color="#b7aed7" stop-opacity="0.2" />
          <stop offset="1" stop-color="#aaa2cf" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="edge-top" gradientUnits="userSpaceOnUse" x1="160" y1="160" x2="850" y2="330">
          <stop offset="0" stop-color="#8572b8" stop-opacity="0" />
          <stop offset="0.13" stop-color="#7c6aab" stop-opacity="0.38" />
          <stop offset="0.23" stop-color="#ded2ff" stop-opacity="0.92" />
          <stop offset="0.36" stop-color="#8980ab" stop-opacity="0.60" />
          <stop offset="0.47" stop-color="#c6b8f1" stop-opacity="0.54" />
          <stop offset="0.60" stop-color="#fbf8ff" stop-opacity="0.78" />
          <stop offset="0.73" stop-color="#9d8bcf" stop-opacity="0.62" />
          <stop offset="0.86" stop-color="#c9baff" stop-opacity="0.75" />
          <stop offset="1" stop-color="#6f5c9d" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="face-top" gradientUnits="userSpaceOnUse" x1="220" y1="155" x2="810" y2="330">
          <stop offset="0" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.14" stop-color="#fff" stop-opacity="0.62" />
          <stop offset="0.24" stop-color="#fff" stop-opacity="0.98" />
          <stop offset="0.35" stop-color="#c9c3e1" stop-opacity="0.74" />
          <stop offset="0.46" stop-color="#fff" stop-opacity="0.92" />
          <stop offset="0.58" stop-color="#e4e0f4" stop-opacity="0.78" />
          <stop offset="0.69" stop-color="#fff" stop-opacity="0.97" />
          <stop offset="0.81" stop-color="#aaa0cd" stop-opacity="0.56" />
          <stop offset="0.91" stop-color="#fff" stop-opacity="0.75" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="metal-bottom" gradientUnits="userSpaceOnUse" x1="370" y1="300" x2="620" y2="390">
          <stop offset="0" stop-color="#a69acb" stop-opacity="0" />
          <stop offset="0.13" stop-color="#c2b9df" stop-opacity="0.70" />
          <stop offset="0.26" stop-color="#fff" stop-opacity="0.97" />
          <stop offset="0.40" stop-color="#d7d2ed" stop-opacity="0.94" />
          <stop offset="0.53" stop-color="#fff" stop-opacity="0.99" />
          <stop offset="0.66" stop-color="#b1a9d2" stop-opacity="0.88" />
          <stop offset="0.79" stop-color="#f7f4ff" stop-opacity="0.95" />
          <stop offset="0.91" stop-color="#887eae" stop-opacity="0.55" />
          <stop offset="1" stop-color="#a69acb" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="edge-bottom" gradientUnits="userSpaceOnUse" x1="380" y1="302" x2="615" y2="390">
          <stop offset="0" stop-color="#9b87d3" stop-opacity="0" />
          <stop offset="0.22" stop-color="#9f8adf" stop-opacity="0.65" />
          <stop offset="0.47" stop-color="#e9e0ff" stop-opacity="0.24" />
          <stop offset="0.72" stop-color="#ad91ff" stop-opacity="0.58" />
          <stop offset="1" stop-color="#a888ff" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="face-bottom" gradientUnits="userSpaceOnUse" x1="390" y1="310" x2="605" y2="390">
          <stop offset="0" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.23" stop-color="#fff" stop-opacity="0.87" />
          <stop offset="0.44" stop-color="#ece7fa" stop-opacity="0.36" />
          <stop offset="0.58" stop-color="#fff" stop-opacity="0.96" />
          <stop offset="0.79" stop-color="#e0d6ff" stop-opacity="0.56" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Upper ribbon: a deliberately asymmetrical, double-peaked M-like gesture. -->
      <g class="ribbon ribbon--top">
        <path :d="topWide" class="ribbon__trail ribbon__trail--back" transform="translate(-9 5)" />
        <path :d="topWide" class="ribbon__trail ribbon__trail--front" transform="translate(6 -2)" />
        <path :d="topWide" class="ribbon__edge" />
        <path :d="topBody" class="ribbon__body" />
        <path :d="topFace" class="ribbon__face" />
        <path :d="topCenterline" class="ribbon__hairline" />
        <path :d="topCenterline" class="ribbon__glint ribbon__glint--top" />
      </g>

      <!-- Lower ribbon: a smaller V-shaped counter-gesture, with its own light falloff. -->
      <g class="ribbon ribbon--bottom">
        <path :d="bottomWide" class="ribbon__trail ribbon__trail--back" transform="translate(-7 4)" />
        <path :d="bottomWide" class="ribbon__trail ribbon__trail--front" transform="translate(4 -1)" />
        <path :d="bottomWide" class="ribbon__edge ribbon__edge--bottom" />
        <path :d="bottomBody" class="ribbon__body ribbon__body--bottom" />
        <path :d="bottomFace" class="ribbon__face ribbon__face--bottom" />
        <path :d="bottomCenterline" class="ribbon__hairline ribbon__hairline--bottom" />
        <path :d="bottomCenterline" class="ribbon__glint ribbon__glint--bottom" />
      </g>
    </svg>
  </section>
</template>

<script setup>
// Generate closed ribbon contours around a cubic-Bezier centerline. The surface is
// a filled silhouette rather than a thick stroke, so its edges can taper to points.
const topSegments = [
  [[170, 294], [221, 294], [242, 283], [261, 250]],
  [[261, 250], [284, 207], [303, 153], [332, 126]],
  [[332, 126], [353, 106], [377, 108], [394, 133]],
  [[394, 133], [418, 170], [432, 239], [460, 263]],
  [[460, 263], [479, 280], [498, 278], [517, 259]],
  [[517, 259], [544, 232], [566, 178], [591, 140]],
  [[591, 140], [612, 109], [634, 104], [652, 125]],
  [[652, 125], [675, 151], [680, 221], [701, 268]],
  [[701, 268], [714, 297], [731, 307], [750, 289]],
  [[750, 289], [770, 269], [789, 237], [815, 211]],
]

const bottomSegments = [
  [[387, 305], [414, 302], [428, 311], [442, 331]],
  [[442, 331], [460, 356], [477, 386], [493, 389]],
  [[493, 389], [509, 388], [527, 358], [545, 334]],
  [[545, 334], [562, 313], [577, 302], [606, 302]],
]

function cubicPoint(segment, t) {
  const [p0, p1, p2, p3] = segment
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ]
}

function sampleSegments(segments) {
  const points = []
  segments.forEach((segment, index) => {
    const polygonLength = Math.hypot(segment[1][0] - segment[0][0], segment[1][1] - segment[0][1])
      + Math.hypot(segment[2][0] - segment[1][0], segment[2][1] - segment[1][1])
      + Math.hypot(segment[3][0] - segment[2][0], segment[3][1] - segment[2][1])
    const steps = Math.max(18, Math.ceil(polygonLength / 3.5))
    for (let i = index === 0 ? 0 : 1; i <= steps; i += 1) {
      points.push(cubicPoint(segment, i / steps))
    }
  })
  return points
}

function fmt(point) {
  return `${point[0].toFixed(2)},${point[1].toFixed(2)}`
}

function centerlinePath(segments) {
  return segments.map((segment, index) => {
    const [p0, p1, p2, p3] = segment
    return `${index === 0 ? `M ${fmt(p0)}` : ''} C ${fmt(p1)} ${fmt(p2)} ${fmt(p3)}`
  }).join(' ')
}

function makeRibbonOutline(segments, halfWidth, phase = 0, scale = 1, offset = 0) {
  const points = sampleSegments(segments)
  const left = []
  const right = []
  const denominator = Math.max(1, points.length - 1)

  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)]
    const next = points[Math.min(points.length - 1, index + 1)]
    const dx = next[0] - previous[0]
    const dy = next[1] - previous[1]
    const length = Math.hypot(dx, dy) || 1
    const nx = -dy / length
    const ny = dx / length
    const t = index / denominator
    const taper = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.48)
    const ripple = 0.91 + 0.09 * Math.sin(t * Math.PI * 4.4 + phase)
    const base = halfWidth * scale * taper * ripple
    const leftWidth = base * (0.90 + 0.10 * Math.sin(t * Math.PI * 3.1 + phase))
    const rightWidth = base * (0.91 + 0.09 * Math.cos(t * Math.PI * 2.7 + phase * 0.8))
    left.push([point[0] + nx * (leftWidth + offset), point[1] + ny * (leftWidth + offset)])
    right.push([point[0] - nx * (rightWidth - offset), point[1] - ny * (rightWidth - offset)])
  })

  const outline = left.concat(right.reverse())
  return `M ${fmt(outline[0])} ${outline.slice(1).map((point) => `L ${fmt(point)}`).join(' ')} Z`
}

const topWide = makeRibbonOutline(topSegments, 9.2, 0.25)
const topBody = makeRibbonOutline(topSegments, 7.25, 1.05)
const topFace = makeRibbonOutline(topSegments, 4.55, 2.3, 1, 1.25)
const topCenterline = centerlinePath(topSegments)
const bottomWide = makeRibbonOutline(bottomSegments, 8.1, 1.1)
const bottomBody = makeRibbonOutline(bottomSegments, 6.45, 2.05)
const bottomFace = makeRibbonOutline(bottomSegments, 4.0, 0.5, 1, 0.9)
const bottomCenterline = centerlinePath(bottomSegments)
</script>

<style scoped>
.verse-hero {
  --verse-accent: #a5a6ff;
  --verse-accent-rgb: 165 166 255;
  --verse-ribbon-rgb: 206 215 238;
  --verse-white-rgb: 232 234 255;
  --verse-shadow-rgb: 0 0 0;
  --verse-ambient-start-opacity: 0.05;
  --verse-ambient-mid-opacity: 0.02;
  --verse-vignette-opacity: 0.14;
  --verse-grain-opacity: 0.7;

  position: relative;
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 520px;
  overflow: hidden;
  isolation: isolate;
  place-items: center;
  border: 1px solid rgb(148 163 184 / 10%);
  border-radius: 24px;
  /* Keep the original background color, gradients and framing unchanged. */
  background:
    radial-gradient(ellipse at 50% 46%, rgb(90 108 180 / 7%), transparent 58%),
    linear-gradient(145deg, rgb(22 28 44 / 32%), rgb(12 17 28 / 12%));
}

/* Retain the original component's light-theme background and canvas effect strengths. */
:global(html:not([data-theme='dark']):not(.dark)) .verse-hero {
  --verse-accent: #7478db;
  --verse-accent-rgb: 116 120 219;
  --verse-ribbon-rgb: 96 106 138;
  --verse-shadow-rgb: 56 68 110;
  --verse-ambient-start-opacity: 0.03;
  --verse-ambient-mid-opacity: 0.012;
  --verse-vignette-opacity: 0.04;
  --verse-grain-opacity: 0.55;
  border-color: rgb(100 116 139 / 15%);
  background:
    radial-gradient(ellipse at 50% 46%, rgb(106 119 209 / 9%), transparent 57%),
    linear-gradient(145deg, rgb(248 250 255 / 94%), rgb(239 243 250 / 78%));
}

:global(html:not([data-theme='dark']):not(.dark)) .verse-hero__grain--dark {
  display: none;
}

:global(html:not([data-theme='dark']):not(.dark)) .verse-hero__grain--light {
  display: block;
}

.verse-hero__background {
  position: absolute;
  z-index: 0;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.verse-hero__art {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.verse-hero__ambient,
.verse-hero__vignette,
.verse-hero__grain {
  pointer-events: none;
}

.verse-hero__ambient {
  opacity: 1;
  animation: ambient-drift 9s ease-in-out infinite alternate;
  transform-origin: 50% 44%;
}

.verse-hero__vignette {
  opacity: 1;
}

.verse-hero__grain {
  pointer-events: none;
}

.verse-hero__grain--dark {
  display: block;
  opacity: var(--verse-grain-opacity);
  mix-blend-mode: plus-lighter;
}

.verse-hero__grain--light {
  display: none;
  opacity: var(--verse-grain-opacity);
  mix-blend-mode: multiply;
}

.ribbon path {
  stroke: none;
  stroke-linejoin: round;
}

.ribbon__trail--back {
  fill: #3d324f;
  opacity: 0.24;
}

.ribbon__trail--front {
  fill: #8270b1;
  opacity: 0.11;
}

.ribbon__edge {
  fill: url(#edge-top);
  opacity: 0.78;
}

.ribbon__edge--bottom {
  fill: url(#edge-bottom);
  opacity: 0.8;
}

.ribbon__body {
  fill: url(#metal-top);
  opacity: 0.98;
}

.ribbon__body--bottom {
  fill: url(#metal-bottom);
}

.ribbon__face {
  fill: url(#face-top);
  opacity: 0.73;
}

.ribbon__face--bottom {
  fill: url(#face-bottom);
  opacity: 0.72;
}

.ribbon__hairline {
  fill: none;
  stroke: rgb(255 255 255 / 60%);
  stroke-width: 1.05;
  stroke-linecap: round;
  opacity: 0.7;
}

.ribbon__hairline--bottom {
  opacity: 0.64;
}

.ribbon__glint {
  fill: none;
  stroke: rgb(255 255 255 / 96%);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-dasharray: 42 1400;
  stroke-dashoffset: 1442;
  opacity: 0.68;
  animation: glint-travel 10.5s linear infinite;
}

.ribbon__glint--bottom {
  stroke-width: 1.3;
  stroke-dasharray: 24 400;
  stroke-dashoffset: 424;
  opacity: 0.58;
  animation-duration: 7.8s;
  animation-delay: -2.6s;
}

@keyframes glint-travel {
  from { stroke-dashoffset: 1442; }
  to { stroke-dashoffset: 0; }
}

@keyframes ambient-drift {
  from { transform: scale(0.94); }
  to { transform: scale(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  .verse-hero__ambient,
  .ribbon__glint {
    animation: none;
  }
  .ribbon__glint {
    display: none;
  }
}

@media (max-width: 640px) {
  .verse-hero {
    min-height: 420px;
    border-radius: 18px;
  }
}
</style>
