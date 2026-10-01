<?php
/**
 * Returns holidays for a given date string (MM-DD).
 * Includes Mexican federal + popular dates.
 */
function getHolidaysForDate(string $mmdd): array {
    $holidays = [
        '01-01' => ['title' => '🎊 ¡Año Nuevo!',              'body' => '¡Feliz año nuevo! Que este año esté lleno de amor y magia ✨',                  'vibrate' => [300,100,300,100,500]],
        '02-02' => ['title' => '🕯️ Día de la Candelaria',      'body' => 'Tradición hermosa de nuestra cultura mexicana 🌮',                              'vibrate' => [200,100,200]],
        '02-05' => ['title' => '🇲🇽 Día de la Constitución',   'body' => 'Día festivo nacional — ¡Viva México! 🦅',                                        'vibrate' => [200,100,200]],
        '02-14' => ['title' => '💕 ¡Feliz San Valentín!',       'body' => 'El día del amor y la amistad 💖 Cuéntale cuánto lo/la quieres',                 'vibrate' => [100,50,100,50,300,50,300]],
        '03-08' => ['title' => '🌷 Día Internacional de la Mujer','body' => '¡Celebra y honra a las mujeres increíbles de tu vida! 💜',                  'vibrate' => [200,100,400]],
        '03-21' => ['title' => '🦅 Natalicio de Benito Juárez', 'body' => 'Día festivo nacional 🇲🇽',                                                       'vibrate' => [200,100,200]],
        '04-01' => ['title' => '😂 Día de los Inocentes (Abril)','body' => '¡Cuidado con las bromas hoy! 🤭',                                              'vibrate' => [100,100,100,100,100]],
        '04-30' => ['title' => '👶 Día del Niño',               'body' => '¡Celebra al niño que llevas dentro! 🎈',                                         'vibrate' => [150,75,150,75,300]],
        '05-01' => ['title' => '💪 Día del Trabajo',            'body' => 'Día festivo nacional — ¡Descansa y disfruta! 🌹',                               'vibrate' => [200,100,200]],
        '05-10' => ['title' => '🌸 ¡Feliz Día de las Madres!',  'body' => '¡Abraza fuerte a tu mamá hoy! ❤️ No hay amor más grande',                       'vibrate' => [200,100,200,100,500]],
        '06-01' => ['title' => '⚓ Día de la Marina',           'body' => 'Día festivo nacional 🇲🇽',                                                       'vibrate' => [200,100,200]],
        '06-15' => ['title' => '👨‍👧 Día del Padre',             'body' => '¡Celebra a los papás especiales de tu vida! 👨‍👦',                              'vibrate' => [200,100,300]],
        '07-04' => ['title' => '🇺🇸 Independence Day',          'body' => '¡Happy 4th of July! 🎆',                                                         'vibrate' => [200,100,200]],
        '09-15' => ['title' => '🎉 ¡Esta noche es el Grito!',   'body' => 'Víspera de Independencia 🇲🇽 ¡Viva México!',                                     'vibrate' => [100,50,100,50,100,50,500]],
        '09-16' => ['title' => '🇲🇽 ¡Día de la Independencia!', 'body' => '¡Viva México! 🦅 ¡Vivan los héroes que nos dieron patria!',                     'vibrate' => [200,100,200,100,500]],
        '10-12' => ['title' => '🌎 Día de la Raza',             'body' => 'Celebración del encuentro de culturas 🌺',                                       'vibrate' => [200,100,200]],
        '10-31' => ['title' => '🎃 ¡Noche de Halloween!',       'body' => 'Noche de calabazas y dulces 🕷️ ¡Cuídate de los sustos!',                        'vibrate' => [100,100,100,100,100,100,300]],
        '11-01' => ['title' => '🌼 Día de Todos Santos',        'body' => 'Recordando con amor a quienes ya no están 💐',                                   'vibrate' => [300,150,300]],
        '11-02' => ['title' => '💀 Día de Muertos',             'body' => 'La tradición más mágica de México 🌸 Honramos a quienes amamos',                'vibrate' => [200,100,200,100,200]],
        '11-20' => ['title' => '🇲🇽 Día de la Revolución',      'body' => 'Día festivo nacional 🦅',                                                        'vibrate' => [200,100,200]],
        '12-01' => ['title' => '🇲🇽 Transmisión de Poder',      'body' => 'Cambio de gobierno en México',                                                   'vibrate' => [200,100,200]],
        '12-12' => ['title' => '🙏 Día de la Virgen de Guadalupe','body' => 'La patrona de México 🌹 ¡Que ella te cuide siempre!',                         'vibrate' => [200,100,300,100,200]],
        '12-24' => ['title' => '🎄 ¡Feliz Nochebuena!',         'body' => '¡Esta noche es mágica! 🎁 Celebra con quienes amas',                            'vibrate' => [200,100,200,100,500,100,500]],
        '12-25' => ['title' => '🎅 ¡Feliz Navidad!',            'body' => '¡Feliz Navidad llena de amor y alegría! 🌟 ¡Ho ho ho!',                         'vibrate' => [200,100,200,100,500]],
        '12-28' => ['title' => '😂 Día de los Inocentes',       'body' => '¡Cuidado con las bromas de hoy! 🤭',                                            'vibrate' => [100,100,100,100,100]],
        '12-31' => ['title' => '🥂 ¡Última noche del año!',     'body' => 'Esta noche brindamos por todo lo vivido ✨ ¡Feliz despedida de año!',            'vibrate' => [300,100,300,100,500]],
    ];

    return $holidays[$mmdd] ?? [];
}

function getTodayHoliday(): array {
    return getHolidaysForDate(date('m-d'));
}

function getTomorrowHoliday(): array {
    $tomorrow = new DateTime('+1 day');
    return getHolidaysForDate($tomorrow->format('m-d'));
}
