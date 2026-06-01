lift = float(input("wieght of lift? "))
reps = int(input("number of reps? "))

ORM = (lift * (1 + (reps / 30)))

print(f"Your 1RM is {ORM:.2f}")