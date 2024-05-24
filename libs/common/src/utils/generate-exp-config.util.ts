import { add } from 'date-fns'

export function generateExpConfig(timeStr: string): Date {
	// Парсим число из строки (убираем последний символ, который является единицей времени)
	const timeValue = parseInt(timeStr.slice(0, -1), 10)
	// Получаем последний символ строки, который обозначает единицу времени
	const timeUnit = timeStr.slice(-1)

	if (!isNaN(timeValue)) {
		switch (timeUnit) {
			case 'h': // Hours
				return add(new Date(), { hours: timeValue })
			case 'd': // Days
				return add(new Date(), { days: timeValue })
			case 'M': // Months
				return add(new Date(), { months: timeValue })
			case 'm': // Minutes
				return add(new Date(), { minutes: timeValue })
			default:
				throw new Error('Invalid time unit in JWT exp')
		}
	} else {
		throw new Error('Time string is not a number')
	}
}
